import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../config/db';
import { env } from '../config/env';
import { asyncRoute, HttpError, ok } from '../utils/http';
import { hashToken, makeResetToken, signAccess, signRefresh, verifyToken } from '../services/security.service';

const router=Router();
const creds=z.object({email:z.string().email().max(255).transform(s=>s.toLowerCase().trim()),password:z.string().min(8).max(120)});
const profile=(user:{id:string,email:string,name:string,role:string})=>({id:user.id,email:user.email,name:user.name,role:user.role});
const cookieOptions={httpOnly:true,secure:env.secureCookie,sameSite:'lax' as const,path:'/api/auth',maxAge:7*24*60*60*1000};

async function startSession(res:import('express').Response,user:{id:string,email:string,name:string,role:string}):Promise<void> {
  const accessToken=signAccess(user.id);
  const refresh=signRefresh(user.id);
  await pool.query(`INSERT INTO refresh_tokens(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '7 days')`,[user.id,hashToken(refresh)]);
  res.cookie('ciko_refresh',refresh,cookieOptions);
  ok(res,{accessToken,user:profile(user)});
}

router.post('/register',asyncRoute(async(req,res)=>{
  const input=creds.extend({name:z.string().trim().min(2).max(120)}).parse(req.body);
  const hash=await bcrypt.hash(input.password,12);
  const saved=await pool.query<{id:string,email:string,name:string,role:string}>(
    'INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id,email,name,role', [input.email,input.name,hash]);
  await startSession(res,saved.rows[0]!);
}));
router.post('/login',asyncRoute(async(req,res)=>{
  const input=creds.parse(req.body);
  const found=await pool.query<{id:string,email:string,name:string,role:string,password_hash:string,blocked:boolean}>(
    'SELECT * FROM users WHERE email=$1',[input.email]);
  const user=found.rows[0];
  if(!user||!(await bcrypt.compare(input.password,user.password_hash))) throw new HttpError(401,'LOGIN_FAILED','Неверная почта или пароль');
  if(user.blocked) throw new HttpError(403,'ACCOUNT_BLOCKED','Аккаунт заблокирован');
  await startSession(res,user);
}));
router.post('/refresh',asyncRoute(async(req,res)=>{
  const token=req.cookies?.ciko_refresh as string|undefined;
  if(!token) throw new HttpError(401,'NO_SESSION','Сессия завершена');
  const payload=verifyToken(token,'refresh');
  // Ротация: старый refresh становится недействительным при каждом обновлении.
  const deleted=await pool.query('DELETE FROM refresh_tokens WHERE token_hash=$1 AND user_id=$2 AND expires_at>NOW() RETURNING id',[hashToken(token),payload.sub]);
  if(!deleted.rowCount) throw new HttpError(401,'SESSION_EXPIRED','Сессия недействительна');
  const result=await pool.query<{id:string,email:string,name:string,role:string,blocked:boolean}>('SELECT id,email,name,role,blocked FROM users WHERE id=$1',[payload.sub]);
  const user=result.rows[0];
  if(!user||user.blocked) throw new HttpError(403,'ACCOUNT_BLOCKED','Доступ к аккаунту закрыт');
  await startSession(res,user);
}));
router.post('/logout',asyncRoute(async(req,res)=>{
  const token=req.cookies?.ciko_refresh as string|undefined;
  if(token) await pool.query('DELETE FROM refresh_tokens WHERE token_hash=$1',[hashToken(token)]);
  res.clearCookie('ciko_refresh',{path:'/api/auth',httpOnly:true,sameSite:'lax',secure:env.secureCookie});
  ok(res,{message:'Вы вышли из аккаунта'});
}));
router.post('/forgot-password',asyncRoute(async(req,res)=>{
  const email=z.string().email().parse(req.body?.email).toLowerCase().trim();
  const user=await pool.query<{id:string}>('SELECT id FROM users WHERE email=$1',[email]);
  if(user.rows[0]) {
    const token=makeResetToken();
    await pool.query('INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL \'20 minutes\')',[user.rows[0].id,hashToken(token)]);
    // По условиям учебного задания разрешено выводить ссылку в консоль вместо email.
    console.log(`Ссылка сброса пароля для ${email}: ${env.publicBaseUrl}/reset-password?token=${token}`);
  }
  ok(res,{message:'Если email существует, ссылка появится в логах API (демо-режим)'});
}));
router.post('/reset-password',asyncRoute(async(req,res)=>{
  const body=z.object({token:z.string().min(20),password:z.string().min(8).max(120)}).parse(req.body);
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const token=await client.query<{id:string,user_id:string}>(
      `SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>NOW() FOR UPDATE`,[hashToken(body.token)]);
    if(!token.rows[0]) throw new HttpError(400,'INVALID_RESET','Ссылка устарела или уже использована');
    await client.query('UPDATE users SET password_hash=$1 WHERE id=$2',[await bcrypt.hash(body.password,12),token.rows[0].user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1',[token.rows[0].id]);
    await client.query('DELETE FROM refresh_tokens WHERE user_id=$1',[token.rows[0].user_id]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  ok(res,{message:'Пароль изменён. Войдите снова.'});
}));
export default router;
