import {Link} from 'react-router-dom';
import {Plus} from 'lucide-react';
import type {Movie} from '../lib/types';
export function MovieCard({movie,onFavorite}:{movie:Movie,index?:number,onFavorite?:(id:string)=>void}){
  return <article className="movie-card"><Link to={`/movie/${movie.id}`} className="poster" aria-label={`Открыть ${movie.title}`}>
    {movie.poster_url?<img loading="lazy" src={movie.poster_url} alt={`Постер ${movie.title}`}/>:<span className="poster-placeholder"><span>CIKO</span><strong>{movie.title}</strong></span>}
    <span className="poster-type">{movie.kind==='series'?'Сериал':'Фильм'}</span>
  </Link><div className="movie-meta"><Link className="movie-name" to={`/movie/${movie.id}`}>{movie.title}</Link>{onFavorite&&<button className="icon-btn small" aria-label={`Добавить ${movie.title} в избранное`} onClick={()=>onFavorite(movie.id)}><Plus size={17}/></button>}</div><div className="movie-sub">{movie.release_year} · {movie.duration_minutes} мин</div></article>;
}
