import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { externalVideoSource } from '../services/security.service';
import { asyncRoute, HttpError, ok } from '../utils/http';

const router = Router();
router.use(requireAuth);
const uuid = z.string().uuid();
const createSchema = z.object({
  title: z.string().trim().min(2).max(120),
  movieId: uuid.nullish(),
  videoUrl: z.string().trim().max(2048).nullish()
});
const updateSchema = z.object({ title:z.string().trim().min(2).max(120) });
const stateSchema = z.object({ playing:z.boolean(), seconds:z.number().finite().min(0).max(1000000) });

// Обычному зрителю достаточно войти: специальных ролей для комнат не требуется.
// Для собственных ссылок разрешены локальные видео и прямые видео/YouTube/Vimeo.
function parseSource(value: string): { url:string, sourceType:'upload'|'external'|'embed' } {
  if (/^\/uploads\/[a-f0-9-]+\.(mp4|webm|ogg)$/.test(value)) return {url:value,sourceType:'upload'};
  const parsed=externalVideoSource(value);
  return {url:parsed.url,sourceType:parsed.sourceType};
}

async function memberRoom(id:string,userId:string) {
  const result=await pool.query(`SELECT r.*,u.name AS owner_name,m.title AS movie_title,
    COALESCE(r.video_url,m.video_url) AS playable_url,
    COALESCE(r.source_type,m.source_type) AS playable_source_type,
    (SELECT COUNT(*)::int FROM room_members WHERE room_id=r.id) AS member_count
    FROM rooms r JOIN users u ON u.id=r.owner_id LEFT JOIN movies m ON m.id=r.movie_id
    JOIN room_members rm ON rm.room_id=r.id AND rm.user_id=$2
    WHERE r.id=$1`,[id,userId]);
  const room=result.rows[0];
  if (!room) throw new HttpError(404,'ROOM_NOT_FOUND','Комната не найдена или у вас нет доступа');
  return room;
}

router.get('/mine',asyncRoute(async(req,res)=>{
  const result=await pool.query(`SELECT r.id,r.code,r.title,r.owner_id,r.created_at,
    COALESCE(m.title,r.title) AS video_title,
    (SELECT COUNT(*)::int FROM room_members WHERE room_id=r.id) AS member_count
    FROM rooms r JOIN room_members rm ON rm.room_id=r.id LEFT JOIN movies m ON m.id=r.movie_id
    WHERE rm.user_id=$1 ORDER BY r.created_at DESC LIMIT 100`,[req.auth!.id]);
  ok(res,result.rows);
}));

router.post('/',asyncRoute(async(req,res)=>{
  const data=createSchema.parse(req.body);
  if (!!data.movieId === !!data.videoUrl) throw new HttpError(400,'SOURCE_REQUIRED','Выберите фильм или укажите ссылку на видео');
  let source:null|{url:string,sourceType:'upload'|'external'|'embed'}=null;
  if (data.videoUrl) source=parseSource(data.videoUrl);
  if (data.movieId) {
    const m=await pool.query('SELECT id,video_url FROM movies WHERE id=$1 AND published=true',[data.movieId]);
    if (!m.rows[0]?.video_url) throw new HttpError(400,'MOVIE_UNAVAILABLE','Выбранный фильм нельзя воспроизвести');
  }
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    // 10 случайных hex-символов. Код можно отправить другому зарегистрированному зрителю.
    const code=randomBytes(5).toString('hex').toUpperCase();
    const added=await client.query(`INSERT INTO rooms(code,owner_id,movie_id,title,video_url,source_type)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id,code,title,owner_id,created_at`,
      [code,req.auth!.id,data.movieId||null,data.title,source?.url||null,source?.sourceType||null]);
    const room=added.rows[0]!;
    await client.query('INSERT INTO room_members(room_id,user_id) VALUES($1,$2)',[room.id,req.auth!.id]);
    await client.query('INSERT INTO audit_logs(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[req.auth!.id,'room.create','room',room.id]);
    await client.query('COMMIT');
    ok(res,room,201);
  } catch(error) { await client.query('ROLLBACK'); throw error; } finally {client.release();}
}));

router.post('/join',asyncRoute(async(req,res)=>{
  const {code}=z.object({code:z.string().trim().regex(/^[a-fA-F0-9]{10}$/)}).parse(req.body);
  const room=await pool.query('SELECT id FROM rooms WHERE code=$1',[code.toUpperCase()]);
  if (!room.rows[0]) throw new HttpError(404,'ROOM_NOT_FOUND','Такой комнаты нет');
  await pool.query('INSERT INTO room_members(room_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[room.rows[0].id,req.auth!.id]);
  ok(res,{id:room.rows[0].id});
}));

router.get('/:id',asyncRoute(async(req,res)=>{
  const room=await memberRoom(uuid.parse(req.params.id),req.auth!.id);
  const people=await pool.query(`SELECT u.id,u.name FROM room_members rm JOIN users u ON u.id=rm.user_id
    WHERE rm.room_id=$1 ORDER BY rm.joined_at ASC LIMIT 80`,[room.id]);
  // Время в комнате продолжается от последнего события play/pause/seek.
  const seconds=Number(room.position_seconds)+(room.playing?(Date.now()-new Date(room.state_updated_at).getTime())/1000:0);
  ok(res,{...room,seconds:Math.max(0,seconds),members:people.rows});
}));

router.patch('/:id',asyncRoute(async(req,res)=>{
  const id=uuid.parse(req.params.id);
  const room=await memberRoom(id,req.auth!.id);
  if (room.owner_id!==req.auth!.id) throw new HttpError(403,'FORBIDDEN','Изменять комнату может создатель');
  const data=updateSchema.parse(req.body);
  await pool.query('UPDATE rooms SET title=$1 WHERE id=$2',[data.title,id]);
  ok(res,{updated:true});
}));

router.put('/:id/state',asyncRoute(async(req,res)=>{
  const id=uuid.parse(req.params.id);
  const room=await memberRoom(id,req.auth!.id);
  if (room.owner_id!==req.auth!.id) throw new HttpError(403,'FORBIDDEN','Управлять просмотром может создатель');
  if (room.playable_source_type==='embed') throw new HttpError(400,'EMBED_UNSUPPORTED','Синхронизация доступна для MP4, WebM и OGG');
  const {playing,seconds}=stateSchema.parse(req.body);
  await pool.query('UPDATE rooms SET playing=$1,position_seconds=$2,state_updated_at=NOW() WHERE id=$3',[playing,seconds,id]);
  ok(res,{playing,seconds});
}));

router.get('/:id/messages',asyncRoute(async(req,res)=>{
  const id=uuid.parse(req.params.id);
  await memberRoom(id,req.auth!.id);
  const items=await pool.query(`SELECT rm.id,rm.body,rm.created_at,u.name FROM room_messages rm
    JOIN users u ON u.id=rm.user_id WHERE rm.room_id=$1 ORDER BY rm.id DESC LIMIT 60`,[id]);
  ok(res,items.rows.reverse());
}));
router.post('/:id/messages',asyncRoute(async(req,res)=>{
  const id=uuid.parse(req.params.id);
  await memberRoom(id,req.auth!.id);
  const {body}=z.object({body:z.string().trim().min(1).max(500)}).parse(req.body);
  const saved=await pool.query(`INSERT INTO room_messages(room_id,user_id,body) VALUES($1,$2,$3) RETURNING id`,[id,req.auth!.id,body]);
  ok(res,{id:saved.rows[0]!.id},201);
}));

router.post('/:id/leave',asyncRoute(async(req,res)=>{
  const id=uuid.parse(req.params.id);
  const room=await memberRoom(id,req.auth!.id);
  if(room.owner_id===req.auth!.id) throw new HttpError(400,'OWNER_CANNOT_LEAVE','Создатель может удалить комнату');
  await pool.query('DELETE FROM room_members WHERE room_id=$1 AND user_id=$2',[id,req.auth!.id]);
  ok(res,{left:true});
}));

router.delete('/:id',asyncRoute(async(req,res)=>{
  const id=uuid.parse(req.params.id);
  const room=await memberRoom(id,req.auth!.id);
  if(room.owner_id!==req.auth!.id) throw new HttpError(403,'FORBIDDEN','Удалить комнату может только создатель');
  await pool.query('DELETE FROM rooms WHERE id=$1',[id]);
  await pool.query('INSERT INTO audit_logs(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[req.auth!.id,'room.delete','room',id]);
  ok(res,{deleted:true});
}));
export default router;
