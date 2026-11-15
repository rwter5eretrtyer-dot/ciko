import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env';
import { requireAuth,requireRole } from '../middleware/auth';
import { HttpError,ok } from '../utils/http';
const router=Router();
// Зрителю разрешена загрузка видео в личную комнату; изображения в каталог добавляет редактор.
router.use(requireAuth);
router.use((req,res,next)=>{
  if(req.query.kind==='video') return next();
  return requireRole('editor','admin')(req,res,next);
});
fs.mkdirSync(env.uploadDir,{recursive:true});
const accepted:Record<string,{ext:string,kind:'video'|'image'}>={
  'video/mp4':{ext:'mp4',kind:'video'},'video/webm':{ext:'webm',kind:'video'},'video/ogg':{ext:'ogg',kind:'video'},
  'image/jpeg':{ext:'jpg',kind:'image'},'image/png':{ext:'png',kind:'image'},'image/webp':{ext:'webp',kind:'image'}
};
// Нельзя верить имени файла от пользователя: имя генерируем самостоятельно.
const upload=multer({
  storage:multer.diskStorage({destination:env.uploadDir,filename:(_req,file,cb)=>cb(null,crypto.randomUUID()+'.'+(accepted[file.mimetype]?.ext ?? 'bin'))}),
  limits:{fileSize:512*1024*1024,files:1},
  fileFilter:(req,file,cb)=>{
    const expected=req.query.kind==='video'?'video':'image';
    const candidate=accepted[file.mimetype];
    if(!candidate||candidate.kind!==expected) return cb(new HttpError(400,'BAD_FILE_TYPE','Допустимы MP4/WebM/OGG для видео и JPG/PNG/WebP для изображений'));
    cb(null,true);
  }
});
router.post('/',(req,res,next)=>{
  upload.single('file')(req,res,error=>{
    if(error) return next(error instanceof multer.MulterError?new HttpError(400,'UPLOAD_ERROR',error.message):error);
    if(!req.file) return next(new HttpError(400,'FILE_REQUIRED','Выберите файл'));
    if(req.query.kind==='image'&&req.file.size>8*1024*1024){fs.unlinkSync(req.file.path);return next(new HttpError(400,'IMAGE_TOO_LARGE','Изображение должно быть не больше 8 МБ'));}
    // Файл уже находится на диске (в Docker используется отдельный volume).
    ok(res,{url:'/uploads/'+req.file.filename,kind:req.query.kind,size:req.file.size},201);
  });
});
export default router;
