import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function ok(res: Response, data: unknown, status=200): void { res.status(status).json({ success:true, data }); }
export function fail(res: Response, status: number, code: string, message: string): void { res.status(status).json({success:false,error:{code,message}}); }
export function asyncRoute(fn:(req:Request,res:Response,next:NextFunction)=>Promise<void>) {
  return (req:Request,res:Response,next:NextFunction) => { Promise.resolve(fn(req,res,next)).catch(next); };
}
export function errors(error:unknown, _req:Request, res:Response, _next:NextFunction):void {
  void _next;
  if (error instanceof HttpError) return fail(res,error.status,error.code,error.message);
  if (error instanceof ZodError) return fail(res,400,'VALIDATION_ERROR',error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '));
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') return fail(res,409,'CONFLICT','РўР°РєР°СЏ Р·Р°РїРёСЃСЊ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚');
  if (error && typeof error === 'object' && 'code' in error && error.code === '22P02') return fail(res,400,'INVALID_ID','РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ');
  console.error('РћС€РёР±РєР° API:',error);
  return fail(res,500,'SERVER_ERROR','Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР°');
}
