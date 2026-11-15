import express from 'express';
import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { pool } from './config/db';
import { openapi } from './config/openapi';
import { asyncRoute, errors, ok, fail } from './utils/http';
import authRoutes from './routes/auth.routes';
import movieRoutes from './routes/movies.routes';
import meRoutes from './routes/me.routes';
import adminRoutes from './routes/admin.routes';
import uploadsRoutes from './routes/uploads.routes';
import studioRoutes from './routes/studio.routes';
import roomsRoutes from './routes/rooms.routes';

export function createApp() {
  const app=express();
  app.disable('x-powered-by');
  app.set('trust proxy',1);
  app.use((_req,res,next)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');next();
  });
  app.use(cors({origin:(origin,cb)=>{
    if(!origin||env.corsOrigins.includes(origin)) return cb(null,true);
    cb(new Error('CORS_ORIGIN_NOT_ALLOWED'));
  },credentials:true}));
  app.use(cookieParser());
  app.use(express.json({limit:'1mb'}));
  app.use('/uploads',express.static(env.uploadDir,{fallthrough:false}));
  app.use('/api/docs',swaggerUi.serve,swaggerUi.setup(openapi));
  app.get('/api/openapi.json',(_req,res)=>res.json(openapi));
  app.get('/api/health',asyncRoute(async(_req,res)=>{await pool.query('SELECT 1');ok(res,{status:'ok',service:'ciko-api'});}));
  const authLimiter=rateLimit({windowMs:15*60*1000,limit:40,standardHeaders:'draft-8',legacyHeaders:false});
  app.use('/api/auth',authLimiter,authRoutes);
  app.use('/api/movies',movieRoutes);
  app.use('/api/me',meRoutes);
  app.use('/api/admin',adminRoutes);
  app.use('/api/uploads',uploadsRoutes);
  app.use('/api/studio',studioRoutes);
  app.use('/api/rooms',roomsRoutes);
  // При облачном развёртывании Express также отдаёт собранный React.
  // В Docker Compose этот блок отключён: там frontend обслуживает Nginx.
  if (env.frontendDir) {
    app.use(express.static(env.frontendDir));
    app.use((req,res,next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads') || !req.accepts('html')) return next();
      res.sendFile(path.join(env.frontendDir, 'index.html'));
    });
  }
  app.use((_req,res)=>fail(res,404,'NOT_FOUND','Маршрут не существует'));
  app.use(errors);
  return app;
}
