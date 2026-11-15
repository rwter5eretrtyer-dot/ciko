import {useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Search,ChevronLeft,ChevronRight} from 'lucide-react';
import {api} from '../lib/api';
import type {Movie,PagedMovies,Genre} from '../lib/types';
import {MovieCard} from '../components/MovieCard';
import {Loader,Empty,ErrorNote} from '../components/Loader';
export function CatalogPage(){
  const [params,setParams]=useSearchParams();const [data,setData]=useState<PagedMovies|null>(null);
  const [genres,setGenres]=useState<Genre[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const searchRef=useRef<HTMLInputElement>(null);const query=params.toString();
  useEffect(()=>{if(params.get('focus'))searchRef.current?.focus();},[params]);
  useEffect(()=>{api<Genre[]>('/movies/genres').then(setGenres).catch(()=>{});},[]);
  useEffect(()=>{let active=true;setLoading(true);setError('');
    api<PagedMovies>('/movies?'+query).then(v=>{if(active)setData(v);}).catch(e=>{if(active)setError((e as Error).message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};},[query]);
  const change=(key:string,value:string)=>{const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);if(key!=='page')next.delete('page');next.delete('focus');setParams(next);};
  const items:Movie[]=data?.items||[];
  return <div className="container simple-page catalog-page"><div className="simple-header"><div className="tiny-label">CIKO</div><h1>Каталог</h1><p>Выберите фильм и нажмите «Смотреть».</p></div>
    <div className="catalog-bar"><label className="search-box"><Search size={18}/><input ref={searchRef} aria-label="Поиск" value={params.get('search')||''} onChange={e=>change('search',e.target.value)} placeholder="Поиск по названию"/></label>
      <select aria-label="Тип" value={params.get('kind')||''} onChange={e=>change('kind',e.target.value)}><option value="">Все</option><option value="movie">Фильмы</option><option value="series">Сериалы</option></select>
      <select aria-label="Жанр" value={params.get('genre')||''} onChange={e=>change('genre',e.target.value)}><option value="">Все жанры</option>{genres.map(g=><option key={g.id} value={g.slug}>{g.name}</option>)}</select>
      <select aria-label="Сортировка" value={params.get('sort')||'newest'} onChange={e=>change('sort',e.target.value)}><option value="newest">Новые</option><option value="year">По году</option><option value="rating">По оценке</option><option value="title">По названию</option></select>
    </div>
    <div className="results-line">{loading?'Поиск...':`${data?.total??0} найдено`}</div>
    {loading?<Loader/>:error?<ErrorNote error={error}/>:items.length?<div className="movie-grid catalog-grid">{items.map((m,i)=><MovieCard key={m.id} movie={m} index={i}/>)}</div>:<Empty title="Ничего не найдено" description="Попробуйте другой запрос."/>}
    {(data?.pages||0)>1&&<div className="pager"><button className="btn btn-outline" disabled={data?.page===1} onClick={()=>change('page',String((data?.page||1)-1))}><ChevronLeft size={16}/> Назад</button><span>{data?.page} / {data?.pages}</span><button className="btn btn-outline" disabled={data?.page===data?.pages} onClick={()=>change('page',String((data?.page||1)+1))}>Дальше <ChevronRight size={16}/></button></div>}
  </div>;
}
