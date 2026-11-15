import { pool } from '../config/db';
import { HttpError } from '../utils/http';

export const movieFields=`m.*, COALESCE((SELECT json_agg(json_build_object('id',g.id,'name',g.name,'slug',g.slug))
 FROM movie_genres mg JOIN genres g ON g.id=mg.genre_id WHERE mg.movie_id=m.id),'[]'::json) AS genres,
 COALESCE((SELECT ROUND(AVG(r.rating)::numeric,1) FROM reviews r WHERE r.movie_id=m.id),0) AS rating`;
export type MovieInput={title:string,description:string,kind:'movie'|'series',releaseYear:number,durationMinutes:number,ageRating:number,posterUrl:string|null,backdropUrl:string|null,videoUrl:string|null,sourceType:'external'|'upload'|'embed',published:boolean,genreIds:number[]};
export async function listMovies(input:{page:number,limit:number,search?:string,kind?:string,genre?:string,year?:number,sort:string}):Promise<{items:unknown[],total:number,page:number,limit:number,pages:number}> {
  const where=['m.published=true'];const args:unknown[]=[];
  const add=(value:unknown)=>{args.push(value);return `$${args.length}`};
  if(input.search) where.push(`m.title ILIKE ${add('%'+input.search+'%')}`);
  if(input.kind) where.push(`m.kind=${add(input.kind)}`);
  if(input.year) where.push(`m.release_year=${add(input.year)}`);
  if(input.genre) where.push(`EXISTS (SELECT 1 FROM movie_genres mg JOIN genres g ON g.id=mg.genre_id WHERE mg.movie_id=m.id AND g.slug=${add(input.genre)})`);
  const filter=where.join(' AND ');
  const count=await pool.query<{count:string}>(`SELECT COUNT(*) FROM movies m WHERE ${filter}`,args);
  const sorts:Record<string,string>={newest:'m.created_at DESC',oldest:'m.created_at ASC',title:'m.title ASC',year:'m.release_year DESC',rating:'rating DESC'};
  const result=await pool.query(`SELECT ${movieFields} FROM movies m WHERE ${filter} ORDER BY ${sorts[input.sort]||sorts.newest} LIMIT ${add(input.limit)} OFFSET ${add((input.page-1)*input.limit)}`,args);
  const total=Number(count.rows[0]?.count||0);
  return {items:result.rows,total,page:input.page,limit:input.limit,pages:Math.ceil(total/input.limit)};
}
export async function findMovie(id:string,includeDraft=false):Promise<any> {
  const result=await pool.query(`SELECT ${movieFields} FROM movies m WHERE m.id=$1 ${includeDraft?'':'AND m.published=true'}`,[id]);
  if(!result.rows[0]) throw new HttpError(404,'MOVIE_NOT_FOUND','Фильм не найден');
  return result.rows[0];
}
export async function saveMovie(input:MovieInput,createdBy:string,id?:string):Promise<any> {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const values=[input.title,input.description,input.kind,input.releaseYear,input.durationMinutes,input.ageRating,input.posterUrl,input.backdropUrl,input.videoUrl,input.sourceType,input.published];
    let result;
    if(id) {
      result=await client.query(`UPDATE movies SET title=$1,description=$2,kind=$3,release_year=$4,duration_minutes=$5,age_rating=$6,
      poster_url=$7,backdrop_url=$8,video_url=$9,source_type=$10,published=$11,updated_at=NOW() WHERE id=$12 RETURNING id`,[...values,id]);
      if(!result.rowCount) throw new HttpError(404,'MOVIE_NOT_FOUND','Фильм не найден');
      await client.query('DELETE FROM movie_genres WHERE movie_id=$1',[id]);
    } else {
      result=await client.query(`INSERT INTO movies(title,description,kind,release_year,duration_minutes,age_rating,poster_url,backdrop_url,video_url,source_type,published,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,[...values,createdBy]);
    }
    const movieId=result.rows[0].id as string;
    for(const genreId of input.genreIds) await client.query('INSERT INTO movie_genres(movie_id,genre_id) VALUES($1,$2)',[movieId,genreId]);
    await client.query('INSERT INTO audit_logs(user_id,action,entity,entity_id) VALUES($1,$2,$3,$4)',[createdBy,id?'movie.update':'movie.create','movie',movieId]);
    await client.query('COMMIT');
    return findMovie(movieId,true);
  } catch(e) {await client.query('ROLLBACK');throw e;} finally {client.release();}
}
