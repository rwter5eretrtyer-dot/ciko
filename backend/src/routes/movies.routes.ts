import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { requireAuth,requireRole } from '../middleware/auth';
import { externalVideoSource } from '../services/security.service';
import { asyncRoute, HttpError, ok } from '../utils/http';
import { findMovie,listMovies,saveMovie,type MovieInput } from '../repositories/movies.repo';

const router=Router();
const uuid=z.string().uuid();
const movieSchema=z.object({
  title:z.string().trim().min(2).max(200), description:z.string().max(12000).default(''),
  kind:z.enum(['movie','series']),releaseYear:z.number().int().min(1888).max(2200),
  durationMinutes:z.number().int().min(1).max(9999),ageRating:z.union([z.literal(0),z.literal(6),z.literal(12),z.literal(16),z.literal(18)]),
  posterUrl:z.string().nullable().default(null),backdropUrl:z.string().nullable().default(null),
  videoUrl:z.string().nullable().default(null),sourceType:z.enum(['external','upload','embed']).default('external'),
  published:z.boolean().default(true),genreIds:z.array(z.number().int().positive()).max(10).default([])
});
function parseMovie(body:unknown):MovieInput {
  const data=movieSchema.parse(body);
  if(data.videoUrl) {
    if(data.videoUrl.startsWith('/uploads/') && /^\/uploads\/[a-f0-9-]+\.(mp4|webm|ogg)$/.test(data.videoUrl)) data.sourceType='upload';
    else {
      const source=externalVideoSource(data.videoUrl);
      data.videoUrl=source.url;data.sourceType=source.sourceType;
    }
  }
  for(const attr of ['posterUrl','backdropUrl'] as const) {
    const url=data[attr];
    if(url && !url.startsWith('/uploads/')) {
      let parsed:URL;
      try{parsed=new URL(url);}catch{throw new HttpError(400,'BAD_IMAGE_URL','Некорректный адрес изображения');}
      if(!['https:','http:'].includes(parsed.protocol)) throw new HttpError(400,'BAD_IMAGE_URL','Изображение должно использовать HTTPS/HTTP');
    }
  }
  return data;
}
router.get('/genres',asyncRoute(async(_req,res)=>{
  const result=await pool.query('SELECT id,slug,name FROM genres ORDER BY name');ok(res,result.rows);
}));
router.get('/',asyncRoute(async(req,res)=>{
  const p=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(48).default(12),
    search:z.string().max(120).optional(),kind:z.enum(['movie','series']).optional(),genre:z.string().max(60).optional(),
    year:z.coerce.number().int().min(1888).max(2200).optional(),sort:z.enum(['newest','oldest','title','year','rating']).default('newest')}).parse(req.query);
  ok(res,await listMovies(p));
}));
router.get('/:id',asyncRoute(async(req,res)=>{ok(res,await findMovie(uuid.parse(req.params.id)));}));
router.post('/',requireAuth,requireRole('editor','admin'),asyncRoute(async(req,res)=>{
  const movie=await saveMovie(parseMovie(req.body),req.auth!.id);ok(res,movie,201);
}));
router.put('/:id',requireAuth,requireRole('editor','admin'),asyncRoute(async(req,res)=>{
  const movie=await saveMovie(parseMovie(req.body),req.auth!.id,uuid.parse(req.params.id));ok(res,movie);
}));
router.delete('/:id',requireAuth,requireRole('editor','admin'),asyncRoute(async(req,res)=>{
  const id=uuid.parse(req.params.id);
  const deleted=await pool.query('DELETE FROM movies WHERE id=$1 RETURNING id',[id]);
  if(!deleted.rowCount) throw new HttpError(404,'MOVIE_NOT_FOUND','Фильм не найден');
  await pool.query('INSERT INTO audit_logs(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[req.auth!.id,'movie.delete','movie',id]);
  ok(res,{deleted:true});
}));
router.get('/:id/reviews',asyncRoute(async(req,res)=>{
  const id=uuid.parse(req.params.id);
  const results=await pool.query(`SELECT r.id,r.rating,r.body,r.created_at,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE movie_id=$1 ORDER BY r.created_at DESC LIMIT 100`,[id]);
  ok(res,results.rows);
}));
router.post('/:id/reviews',requireAuth,asyncRoute(async(req,res)=>{
  const id=uuid.parse(req.params.id);
  const body=z.object({rating:z.number().int().min(1).max(5),body:z.string().max(1200).default('')}).parse(req.body);
  await findMovie(id);
  const result=await pool.query(`INSERT INTO reviews(user_id,movie_id,rating,body) VALUES($1,$2,$3,$4)
    ON CONFLICT(user_id,movie_id) DO UPDATE SET rating=EXCLUDED.rating,body=EXCLUDED.body RETURNING *`,[req.auth!.id,id,body.rating,body.body]);
  ok(res,result.rows[0],201);
}));
export default router;
