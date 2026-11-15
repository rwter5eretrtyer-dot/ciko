import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {ArrowLeft,Heart,Users,Play,Star} from 'lucide-react';
import {api} from '../lib/api';
import type {Movie} from '../lib/types';
import {Loader,ErrorNote} from '../components/Loader';
import {useAuth} from '../context/AuthContext';
type Review={id:string,name:string,rating:number,body:string,created_at:string};
export function MoviePage(){
  const {id}=useParams();const {user}=useAuth();const navigate=useNavigate();const [movie,setMovie]=useState<Movie|null>(null);
  const [reviews,setReviews]=useState<Review[]>([]);const [error,setError]=useState('');const [rating,setRating]=useState(5);
  const [review,setReview]=useState('');const [notice,setNotice]=useState('');const video=useRef<HTMLVideoElement>(null);
  const lastSave=useRef(0);const progress=useRef(0);
  useEffect(()=>{if(!id)return;api<Movie>(`/movies/${id}`).then(setMovie).catch(e=>setError((e as Error).message));api<Review[]>(`/movies/${id}/reviews`).then(setReviews).catch(()=>{});
    if(user)api<Movie[]>('/me/history').then(items=>{progress.current=items.find(m=>m.id===id)?.progress_seconds||0;}).catch(()=>{});},[id,user]);
  const save=(completed=false)=>{if(!user||!id||!video.current)return;if(!completed&&Date.now()-lastSave.current<10000)return;
    lastSave.current=Date.now();void api(`/me/progress/${id}`,{method:'PUT',body:JSON.stringify({progressSeconds:Math.floor(video.current.currentTime||0),completed})}).catch(()=>{});};
  const favorite=async()=>{if(!user)return navigate('/login');try{await api(`/me/favorites/${id}`,{method:'POST'});setNotice('Добавлено в избранное');}catch(e){setNotice((e as Error).message);}};
  const submitReview=async(e:FormEvent)=>{e.preventDefault();if(!user)return navigate('/login');try{
    await api(`/movies/${id}/reviews`,{method:'POST',body:JSON.stringify({rating,body:review})});setReview('');setReviews(await api<Review[]>(`/movies/${id}/reviews`));setNotice('Отзыв сохранён');
  }catch(e){setNotice((e as Error).message);}};
  if(error)return <div className="container simple-page"><ErrorNote error={error}/></div>;
  if(!movie)return <Loader/>;
  return <div className="container simple-page movie-detail"><Link className="back-link" to="/catalog"><ArrowLeft size={15}/> Каталог</Link>
    <div className="movie-top"><div className="movie-cover">{movie.poster_url?<img src={movie.poster_url} alt={`Постер ${movie.title}`}/>:<span>{movie.title.slice(0,1)}</span>}</div>
      <div className="movie-info"><div className="tiny-label">{movie.kind==='series'?'СЕРИАЛ':'ФИЛЬМ'} · {movie.release_year} · {movie.age_rating}+</div><h1>{movie.title}</h1><div className="muted">{movie.duration_minutes} мин{Number(movie.rating)>0?` · ${Number(movie.rating).toFixed(1)} / 5`:''}</div>
        <p>{movie.description||'Описание пока не добавлено.'}</p><div className="genre-tags">{movie.genres?.map(g=><span key={g.id}>{g.name}</span>)}</div>
        <div className="movie-buttons"><a href="#player" className="btn btn-khaki"><Play size={16}/> Смотреть</a><button className="btn btn-outline" onClick={()=>void favorite()}><Heart size={16}/> В список</button>{movie.video_url&&<Link className="btn btn-outline" to={`/rooms?movieId=${movie.id}`}><Users size={16}/> Комната</Link>}</div>
      </div></div>
    {notice&&<div className="success-note">{notice}</div>}
    <section id="player" className="movie-watch"><div className="simple-section-head"><h2>Просмотр</h2></div>
      <div className="watch-player">{!movie.video_url?<div className="no-video">Видео ещё не добавлено</div>:movie.source_type==='embed'?<iframe title={movie.title} src={movie.video_url} allow="autoplay; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<video ref={video} controls playsInline preload="metadata" src={movie.video_url} poster={movie.backdrop_url||movie.poster_url||undefined} onLoadedMetadata={()=>{if(video.current&&progress.current>0)video.current.currentTime=progress.current;}} onTimeUpdate={()=>save()} onPause={()=>save()} onEnded={()=>save(true)}/>}
      </div></section>
    <section className="reviews-section"><h2>Отзывы</h2><div className="reviews-layout"><div className="reviews-list">{reviews.length?reviews.map(r=><div className="review" key={r.id}><div className="review-top"><strong>{r.name}</strong><span><Star size={14}/> {r.rating}/5</span></div><p>{r.body}</p></div>):<p className="muted">Отзывов пока нет.</p>}</div>
      <form className="panel form-stack" onSubmit={e=>void submitReview(e)}><h3>Добавить отзыв</h3><label>Оценка<select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(x=><option key={x} value={x}>{x}</option>)}</select></label><label>Текст<textarea rows={4} maxLength={1200} value={review} onChange={e=>setReview(e.target.value)} placeholder="Ваш отзыв"/></label><button className="btn btn-outline">{user?'Опубликовать':'Войти'}</button></form></div></section>
  </div>;
}
