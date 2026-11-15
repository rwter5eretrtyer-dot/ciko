import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { movieFields } from '../repositories/movies.repo';
import { asyncRoute,HttpError,ok } from '../utils/http';
const router=Router();
router.use(requireAuth);
router.get('/',asyncRoute(async(req,res)=>{
  const result=await pool.query('SELECT id,email,name,role,created_at FROM users WHERE id=$1',[req.auth!.id]);ok(res,result.rows[0]);
}));
router.patch('/',asyncRoute(async(req,res)=>{
  const {name}=z.object({name:z.string().trim().min(2).max(120)}).parse(req.body);
  const result=await pool.query('UPDATE users SET name=$1 WHERE id=$2 RETURNING id,name,email,role',[name,req.auth!.id]);ok(res,result.rows[0]);
}));
router.post('/password',asyncRoute(async(req,res)=>{
  const {oldPassword,newPassword}=z.object({oldPassword:z.string(),newPassword:z.string().min(8).max(120)}).parse(req.body);
  const current=await pool.query<{password_hash:string}>('SELECT password_hash FROM users WHERE id=$1',[req.auth!.id]);
  if(!await bcrypt.compare(oldPassword,current.rows[0]!.password_hash)) throw new HttpError(400,'BAD_PASSWORD','Текущий пароль неверный');
  await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2',[await bcrypt.hash(newPassword,12),req.auth!.id]);
  await pool.query('DELETE FROM refresh_tokens WHERE user_id=$1',[req.auth!.id]);
  ok(res,{message:'Пароль изменён. При следующем входе потребуется авторизация.'});
}));
router.get('/favorites',asyncRoute(async(req,res)=>{
  const result=await pool.query(`SELECT ${movieFields} FROM favorites f JOIN movies m ON m.id=f.movie_id WHERE f.user_id=$1 AND m.published=true ORDER BY f.created_at DESC`,[req.auth!.id]);ok(res,result.rows);
}));
router.post('/favorites/:id',asyncRoute(async(req,res)=>{
  const id=z.string().uuid().parse(req.params.id);
  await pool.query('INSERT INTO favorites(user_id,movie_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.auth!.id,id]);ok(res,{favorite:true});
}));
router.delete('/favorites/:id',asyncRoute(async(req,res)=>{
  const id=z.string().uuid().parse(req.params.id);
  await pool.query('DELETE FROM favorites WHERE user_id=$1 AND movie_id=$2',[req.auth!.id,id]);ok(res,{favorite:false});
}));
router.get('/history',asyncRoute(async(req,res)=>{
  const result=await pool.query(`SELECT ${movieFields},h.progress_seconds,h.completed,h.updated_at AS watched_at
    FROM watch_history h JOIN movies m ON m.id=h.movie_id WHERE h.user_id=$1 AND m.published=true ORDER BY h.updated_at DESC LIMIT 60`,[req.auth!.id]);ok(res,result.rows);
}));
router.put('/progress/:id',asyncRoute(async(req,res)=>{
  const id=z.string().uuid().parse(req.params.id);
  const body=z.object({progressSeconds:z.number().int().min(0).max(1000000),completed:z.boolean().default(false)}).parse(req.body);
  await pool.query(`INSERT INTO watch_history(user_id,movie_id,progress_seconds,completed) VALUES($1,$2,$3,$4)
    ON CONFLICT(user_id,movie_id) DO UPDATE SET progress_seconds=$3,completed=$4,updated_at=NOW()`,
    [req.auth!.id,id,body.progressSeconds,body.completed]);
  ok(res,{saved:true});
}));
export default router;
