import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { env } from '../config/env';

// Демо-данные создаются только при SEED_DEMO=true. На публичном сервере выключить!
export async function seed(): Promise<void> {
  const genres = [['drama','Драма'],['sci-fi','Фантастика'],['documentary','Документальное'],['art','Артхаус'],['thriller','Триллер'],['animation','Анимация']];
  for (const [slug,name] of genres) await pool.query('INSERT INTO genres(slug,name) VALUES($1,$2) ON CONFLICT(slug) DO NOTHING', [slug,name]);
  if (!env.seedDemo) return;
  const demos: Array<[string,string,string]> = [
    ['viewer@ciko.local','Зритель','viewer'], ['editor@ciko.local','Редактор','editor'], ['admin@ciko.local','Администратор','admin']
  ];
  for (const [email,name,role] of demos) {
    await pool.query('INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING',
      [email,name,await bcrypt.hash('CikoDemo2026!', 12),role]);
  }
  const admin = await pool.query<{id:string}>('SELECT id FROM users WHERE email=$1', ['admin@ciko.local']);
  if (!admin.rows[0]) return;
  const films = [
    ['После света','Экспериментальная короткометражка о цвете, времени и воспоминаниях.','movie',2026,3,0,'documentary'],
    ['Нулевая точка','Тихая история о начале нового пути. Демонстрационная карточка каталога.','movie',2025,94,12,'drama'],
    ['Третий берег','Сериал о городе, который каждый вечер становится другим.','series',2026,42,16,'sci-fi'],
    ['Одиннадцать минут','Минималистичный фильм о моменте, который меняет всё.','movie',2024,88,12,'art'],
    ['Пока мы здесь','Документальный цикл о людях и местах.','series',2025,37,0,'documentary'],
    ['Бордовый час','Нуарная история без лишних слов.','movie',2026,106,16,'thriller']
  ] as const;
  for (let i=0;i<films.length;i++) {
    const [title,description,kind,year,duration,age,genre] = films[i]!;
    const existing = await pool.query('SELECT id FROM movies WHERE title=$1', [title]);
    if (existing.rowCount) continue;
    const videoUrl = i===0 ? 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' : null;
    const result = await pool.query<{id:string}>(`INSERT INTO movies(title,description,kind,release_year,duration_minutes,age_rating,video_url,source_type,published,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,'external',true,$8) RETURNING id`,[title,description,kind,year,duration,age,videoUrl,admin.rows[0].id]);
    await pool.query('INSERT INTO movie_genres(movie_id,genre_id) SELECT $1,id FROM genres WHERE slug=$2', [result.rows[0]!.id,genre]);
  }
  console.log('Демо-данные созданы (только первый фильм имеет открытое демо-видео).');
}
if (require.main === module) seed().then(() => pool.end()).catch(error => { console.error(error); process.exit(1); });
