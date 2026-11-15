import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { verifyToken, type Role } from '../services/security.service';
import { asyncRoute, HttpError } from '../utils/http';

// Добавляем req.auth: после проверки токена знаем идентификатор и реальную роль.
declare global { namespace Express { interface Request { auth?:{id:string,role:Role,email:string} } } }
export const requireAuth=asyncRoute(async(req:Request,_res:Response,next:NextFunction)=>{
  const token=req.headers.authorization?.replace(/^Bearer\s+/i,'');
  if(!token) throw new HttpError(401,'UNAUTHORIZED','Сначала войдите в аккаунт');
  const payload=verifyToken(token,'access');
  const result=await pool.query<{id:string,role:Role,email:string,blocked:boolean}>('SELECT id,role,email,blocked FROM users WHERE id=$1',[payload.sub]);
  const user=result.rows[0];
  if(!user||user.blocked) throw new HttpError(403,'ACCOUNT_BLOCKED','Аккаунт не найден или заблокирован');
  req.auth={id:user.id,role:user.role,email:user.email};
  next();
});
export const requireRole=(...allowed:Role[])=>(req:Request,_res:Response,next:NextFunction):void=>{
  if(!req.auth||!allowed.includes(req.auth.role)) return next(new HttpError(403,'FORBIDDEN','Недостаточно прав для этого действия'));
  next();
};
