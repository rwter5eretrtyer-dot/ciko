import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { requireAuth,requireRole } from '../middleware/auth';
import { asyncRoute,HttpError,ok } from '../utils/http';
const router=Router();
router.use(requireAuth,requireRole('admin'));
router.get('/users',asyncRoute(async(req,res)=>{
  const query=z.object({search:z.string().max(100).optional(),page:z.coerce.number().int().min(1).default(1)}).parse(req.query);
  const like='%'+(query.search||'')+'%';
  const result=await pool.query(`SELECT id,email,name,role,blocked,created_at FROM users WHERE email ILIKE $1 OR name ILIKE $1 ORDER BY created_at DESC LIMIT 20 OFFSET $2`,[like,(query.page-1)*20]);
  ok(res,result.rows);
}));
router.patch('/users/:id',asyncRoute(async(req,res)=>{
  const id=z.string().uuid().parse(req.params.id);
  const body=z.object({role:z.enum(['viewer','editor','admin']).optional(),blocked:z.boolean().optional()}).refine(b=>b.role!==undefined||b.blocked!==undefined).parse(req.body);
  if(id===req.auth!.id && (body.blocked===true||body.role && body.role!=='admin')) throw new HttpError(400,'SELF_ADMIN','Нельзя убрать права или заблокировать самого себя');
  const saved=await pool.query(`UPDATE users SET role=COALESCE($1,role),blocked=COALESCE($2,blocked) WHERE id=$3 RETURNING id,email,name,role,blocked`,[body.role??null,body.blocked??null,id]);
  if(!saved.rows[0]) throw new HttpError(404,'USER_NOT_FOUND','Пользователь не найден');
  await pool.query('DELETE FROM refresh_tokens WHERE user_id=$1',[id]);
  await pool.query('INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES($1,$2,$3,$4,$5)',[req.auth!.id,'user.update','user',id,JSON.stringify(body)]);
  ok(res,saved.rows[0]);
}));
router.get('/dashboard',asyncRoute(async(_req,res)=>{
  const stats=await pool.query(`SELECT
    (SELECT COUNT(*)::int FROM users) AS users,
    (SELECT COUNT(*)::int FROM movies) AS movies,
    (SELECT COUNT(*)::int FROM movies WHERE kind='series') AS series,
    (SELECT COUNT(*)::int FROM favorites) AS favorites,
    (SELECT COUNT(*)::int FROM reviews) AS reviews`);
  const activity=await pool.query(`SELECT to_char(days.day,'DD.MM') AS day,COUNT(w.updated_at)::int AS views
    FROM generate_series(CURRENT_DATE-6,CURRENT_DATE,INTERVAL '1 day') AS days(day)
    LEFT JOIN watch_history w ON w.updated_at::date=days.day::date
    GROUP BY days.day ORDER BY days.day`);
  ok(res,{stats:stats.rows[0],activity:activity.rows});
}));
router.get('/audit',asyncRoute(async(_req,res)=>{
  const logs=await pool.query(`SELECT a.id,a.action,a.entity,a.entity_id,a.details,a.created_at,u.email
    FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 50`);
  ok(res,logs.rows);
}));
router.get('/export',asyncRoute(async(_req,res)=>{
  const result=await pool.query(`SELECT m.title,m.kind,m.release_year,COUNT(w.user_id)::int AS views
    FROM movies m LEFT JOIN watch_history w ON w.movie_id=m.id GROUP BY m.id ORDER BY views DESC`);
  // CSV открывается в Excel, что даёт полезный экспорт без серверного XLSX-генератора.
  const csv='\ufeffНазвание;Тип;Год;Просмотры\n'+result.rows.map(r=>[r.title,r.kind,r.release_year,r.views].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="ciko-report.csv"');res.send(csv);
}));
export default router;
