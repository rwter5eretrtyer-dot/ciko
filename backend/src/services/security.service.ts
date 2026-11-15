import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../utils/http';

export type Role = 'viewer'|'editor'|'admin';
export const ROLES: Role[] = ['viewer','editor','admin'];
export const isRole = (role:string): role is Role => ROLES.includes(role as Role);
export const canManageMovies = (role:Role):boolean => role==='editor'||role==='admin';
export const canManageUsers = (role:Role):boolean => role==='admin';
export const hashToken=(token:string):string=>crypto.createHash('sha256').update(token).digest('hex');
export const makeResetToken=():string=>crypto.randomBytes(32).toString('hex');
export function signAccess(userId:string):string { return jwt.sign({sub:userId,type:'access'},env.accessSecret,{expiresIn:'15m'}); }
export function signRefresh(userId:string):string { return jwt.sign({sub:userId,type:'refresh',jti:crypto.randomUUID()},env.refreshSecret,{expiresIn:'7d'}); }
export function verifyToken(token:string,kind:'access'|'refresh'):{sub:string} {
  try {
    const payload=jwt.verify(token,kind==='access'?env.accessSecret:env.refreshSecret);
    if(typeof payload==='string'||payload.type!==kind||typeof payload.sub!=='string') throw new Error('Неверный тип');
    return {sub:payload.sub};
  } catch { throw new HttpError(401,'UNAUTHORIZED','Нужно снова войти в аккаунт'); }
}
export function externalVideoSource(input:string):{sourceType:'external'|'embed',url:string} {
  let u:URL;
  try {u=new URL(input);} catch {throw new HttpError(400,'BAD_VIDEO_URL','Введите полный адрес видео с https://');}
  if (!['https:','http:'].includes(u.protocol) || u.username || u.password) throw new HttpError(400,'BAD_VIDEO_URL','Разрешены только обычные HTTPS/HTTP ссылки');
  const host=u.hostname.toLowerCase();
  if(host==='www.youtube-nocookie.com' && /^\/embed\/[\w-]{11}$/.test(u.pathname)) return {sourceType:'embed',url:u.origin+u.pathname};
  if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be'].includes(host)) {
    const id=host.includes('youtu.be')?u.pathname.slice(1):u.searchParams.get('v') || u.pathname.match(/^\/shorts\/([\w-]{11})$/)?.[1];
    if(!id||!/^[\w-]{11}$/.test(id)) throw new HttpError(400,'BAD_VIDEO_URL','Некорректная ссылка YouTube');
    return {sourceType:'embed',url:`https://www.youtube-nocookie.com/embed/${id}`};
  }
  if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)) {
    const id=u.pathname.split('/').filter(Boolean).pop();
    if(!id||!/^[0-9]+$/.test(id)) throw new HttpError(400,'BAD_VIDEO_URL','Некорректная ссылка Vimeo');
    return {sourceType:'embed',url:`https://player.vimeo.com/video/${id}`};
  }
  // Для других доменов браузер сможет воспроизвести только прямую ссылку на видео.
  if(!/\.(mp4|webm|ogg)(\?.*)?$/i.test(u.pathname+u.search)) throw new HttpError(400,'BAD_VIDEO_URL','Нужна прямая ссылка .mp4/.webm/.ogg либо YouTube/Vimeo');
  return {sourceType:'external',url:u.toString()};
}
