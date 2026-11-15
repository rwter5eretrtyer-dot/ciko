import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import request from 'supertest';
import {createApp} from '../src/app';
import {pool} from '../src/config/db';
import {migrate} from '../src/utils/migrate';

// Интеграционные тесты используют настоящую тестовую PostgreSQL, а не фейковый объект.
const app=createApp();
const email=`ci-${Date.now()}@example.test`;
const guestEmail=`ci-guest-${Date.now()}@example.test`;
let accessToken='';
beforeAll(async()=>{await migrate();});
afterAll(async()=>{await pool.query('DELETE FROM users WHERE email=ANY($1)',[[email,guestEmail]]);await pool.end();});
describe('HTTP API',()=>{
  it('GET /api/health подтверждает связь с базой',async()=>{
    const r=await request(app).get('/api/health');expect(r.status).toBe(200);expect(r.body.data.status).toBe('ok');
  });
  it('регистрация создаёт зрителя с access-токеном',async()=>{
    const r=await request(app).post('/api/auth/register').send({name:'Тестовый зритель',email,password:'SafePassword2026!'});
    expect(r.status).toBe(200);expect(r.body.data.user.role).toBe('viewer');accessToken=r.body.data.accessToken;
  });
  it('зрителю запрещено добавлять фильмы (RBAC на сервере)',async()=>{
    const r=await request(app).post('/api/movies').set('Authorization',`Bearer ${accessToken}`).send({title:'Тест'});
    expect(r.status).toBe(403);expect(r.body.error.code).toBe('FORBIDDEN');
  });
  it('сервер проверяет некорректный логин',async()=>{
    const r=await request(app).post('/api/auth/login').send({email,password:'WrongPassword2026!'});
    expect(r.status).toBe(401);
  });
  it('каталог выдаёт данные с пагинацией',async()=>{
    const r=await request(app).get('/api/movies?page=1&limit=2&sort=newest');
    expect(r.status).toBe(200);expect(r.body.data.limit).toBe(2);expect(Array.isArray(r.body.data.items)).toBe(true);
  });
  it('зритель создаёт комнату, приглашает гостя и управляет общим видео',async()=>{
    // Полный API-сценарий на настоящей тестовой PostgreSQL.
    const created=await request(app).post('/api/rooms').set('Authorization',`Bearer ${accessToken}`)
      .send({title:'Вечерний просмотр',videoUrl:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'});
    expect(created.status).toBe(201);
    const roomId=created.body.data.id as string;
    const code=created.body.data.code as string;
    expect(code).toMatch(/^[A-F0-9]{10}$/);
    const outsider=await request(app).post('/api/auth/register')
      .send({name:'Гость комнаты',email:guestEmail,password:'SafePassword2026!'});
    expect(outsider.status).toBe(200);
    const guest=outsider.body.data.accessToken as string;
    const denied=await request(app).get(`/api/rooms/${roomId}`).set('Authorization',`Bearer ${guest}`);
    expect(denied.status).toBe(404); // Пока не вступил, содержимое комнаты закрыто.
    const joined=await request(app).post('/api/rooms/join').set('Authorization',`Bearer ${guest}`).send({code});
    expect(joined.status).toBe(200);
    const data=await request(app).get(`/api/rooms/${roomId}`).set('Authorization',`Bearer ${guest}`);
    expect(data.status).toBe(200);
    expect(data.body.data.member_count).toBe(2);
    const forbidden=await request(app).put(`/api/rooms/${roomId}/state`).set('Authorization',`Bearer ${guest}`)
      .send({playing:true,seconds:10});
    expect(forbidden.status).toBe(403);
    const playing=await request(app).put(`/api/rooms/${roomId}/state`).set('Authorization',`Bearer ${accessToken}`)
      .send({playing:true,seconds:10});
    expect(playing.status).toBe(200);
    const sent=await request(app).post(`/api/rooms/${roomId}/messages`).set('Authorization',`Bearer ${guest}`)
      .send({body:'Привет!'});
    expect(sent.status).toBe(201);
    const messages=await request(app).get(`/api/rooms/${roomId}/messages`).set('Authorization',`Bearer ${accessToken}`);
    expect(messages.body.data.some((m:{body:string})=>m.body==='Привет!')).toBe(true);
  });
});
