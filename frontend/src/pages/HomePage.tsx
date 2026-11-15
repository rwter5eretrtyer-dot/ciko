import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Play,Users} from 'lucide-react';
import {api} from '../lib/api';
import type {Movie,PagedMovies} from '../lib/types';
import {MovieCard} from '../components/MovieCard';
import {Empty,ErrorNote,Loader} from '../components/Loader';
export function HomePage(){
  const [movies,setMovies]=useState<Movie[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  useEffect(()=>{api<PagedMovies>('/movies?limit=12').then(d=>setMovies(d.items)).catch(e=>setError((e as Error).message)).finally(()=>setLoading(false));},[]);
  return <div className="container home-simple">
    <div className="home-intro"><div className="tiny-label">CIKO</div><h1>Смотреть кино.</h1><p>Фильмы, сериалы и комнаты для просмотра с друзьями.</p><div className="home-actions"><Link to="/catalog" className="btn btn-khaki"><Play size={16}/> Каталог</Link><Link to="/rooms" className="btn btn-outline"><Users size={16}/> Комнаты</Link></div></div>
    <div className="simple-section-head"><h2>Каталог</h2><Link className="text-link" to="/catalog">Все фильмы <ArrowRight size={16}/></Link></div>
    {loading?<Loader/>:error?<ErrorNote error={error}/>:movies.length?<div className="movie-grid">{movies.slice(0,10).map((m,i)=><MovieCard key={m.id} movie={m} index={i}/>)}</div>:<Empty title="Фильмов пока нет" description="Редактор может добавить первый фильм."/>}
  </div>;
}
