import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { requireAuth,requireRole } from '../middleware/auth';
import { movieFields,findMovie } from '../repositories/movies.repo';
import { asyncRoute,ok } from '../utils/http';
const router=Router();router.use(requireAuth,requireRole('editor','admin'));
router.get('/movies',asyncRoute(async(_req,res)=>{
  const result=await pool.query(`SELECT ${movieFields} FROM movies m ORDER BY m.created_at DESC LIMIT 300`);ok(res,result.rows);
}));
router.get('/movies/:id',asyncRoute(async(req,res)=>{ok(res,await findMovie(z.string().uuid().parse(req.params.id),true));}));
export default router;
