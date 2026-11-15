import {useEffect,useState,type FormEvent} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {ArrowRight,Bookmark,Clapperboard,History as HistoryIcon,Shield,UserRound,Users} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {api} from '../lib/api';
import type {Movie} from '../lib/types';
import {roleLabel} from '../lib/utils';
import {MovieCard} from '../components/MovieCard';
import {Empty,ErrorNote,Loader} from '../components/Loader';
export function ProfilePage(){
  const {user,reload}=useAuth();const [name,setName]=useState(user?.name||'');const [oldPassword,setOld]=useState('');const [newPassword,setNew]=useState('');const [message,setMessage]=useState('');const [error,setError]=useState('');
  useEffect(()=>{setName(user?.name||'');},[user?.name]);
  const update=async(e:FormEvent)=>{e.preventDefault();setError('');try{await api('/me',{method:'PATCH',body:JSON.stringify({name})});await reload();setMessage('Профиль сохранён');}catch(e){setError((e as Error).message);}};
  const password=async(e:FormEvent)=>{e.preventDefault();setError('');try{await api('/me/password',{method:'POST',body:JSON.stringify({oldPassword,newPassword})});setOld('');setNew('');setMessage('Пароль изменён');}catch(e){setError((e as Error).message);}};
  return <div className="container spaced profile-page"><span className="section-overline">CIKO / ПРОФИЛЬ</span><div className="page-title-row"><h1>Мой профиль<span className="wine-dot">.</span></h1><p>{user?.email}</p></div>
    <div className="profile-intro"><div className="profile-avatar">{(user?.name||'C').slice(0,1).toUpperCase()}</div><div><span>ВАШ АККАУНТ</span><h2>{user?.name}</h2><p>{user&&roleLabel[user.role]}</p></div></div>
    <div className="quick-links"><Link to="/rooms"><Users size={20}/><span>Комнаты</span><ArrowRight size={17}/></Link><Link to="/favorites"><Bookmark size={20}/><span>Мой список</span><ArrowRight size={17}/></Link><Link to="/history"><HistoryIcon size={20}/><span>История просмотров</span><ArrowRight size={17}/></Link>{user?.role!=='viewer'&&<Link to="/studio"><Clapperboard size={20}/><span>Студия</span><ArrowRight size={17}/></Link>}{user?.role==='admin'&&<Link to="/admin"><Shield size={20}/><span>Управление</span><ArrowRight size={17}/></Link>}</div>
    {error&&<ErrorNote error={error}/>} {message&&<div className="success-note">{message}</div>}
    <div className="profile-forms"><form className="form-stack panel" onSubmit={e=>void update(e)}><h2><UserRound size={21}/> Личные данные</h2><label>Имя<input value={name} minLength={2} required onChange={e=>setName(e.target.value)}/></label><label>Почта<input disabled value={user?.email||''}/></label><button className="btn btn-khaki">Сохранить</button></form>
      <form className="form-stack panel" onSubmit={e=>void password(e)}><h2><Shield size={21}/> Безопасность</h2><label>Текущий пароль<input type="password" required value={oldPassword} onChange={e=>setOld(e.target.value)}/></label><label>Новый пароль<input type="password" minLength={8} required value={newPassword} onChange={e=>setNew(e.target.value)}/></label><button className="btn btn-outline">Изменить пароль</button></form></div>
  </div>;
}
function MovieCollection({kind}:{kind:'favorites'|'history'}){
  const [items,setItems]=useState<Movie[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const navigate=useNavigate();
  useEffect(()=>{api<Movie[]>(kind==='favorites'?'/me/favorites':'/me/history').then(setItems).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[kind]);
  const remove=async(id:string)=>{await api(`/me/favorites/${id}`,{method:'DELETE'});setItems(old=>old.filter(x=>x.id!==id));};
  return <div className="container spaced"><span className="section-overline">CIKO / ПРОФИЛЬ</span><div className="page-title-row"><h1>{kind==='favorites'?'Мой список':'История'}<span className="wine-dot">.</span></h1><p>{kind==='favorites'?'Фильмы, которые вы сохранили.':'История просмотра.'}</p></div>
    {loading?<Loader/>:error?<ErrorNote error={error}/>:items.length?<div className="movie-grid">{items.map((m,i)=><div key={m.id}><MovieCard movie={m} index={i}/>{kind==='favorites'?<button className="subtle-button" onClick={()=>void remove(m.id)}>Удалить из списка</button>:<button className="subtle-button" onClick={()=>navigate(`/movie/${m.id}`)}>Продолжить: {m.progress_seconds||0} сек.</button>}</div>)}</div>:<Empty title="Ваша коллекция пока пуста" description="Откройте каталог."/>}
    <Link className="text-link inline-spacer" to="/catalog">Перейти в каталог <ArrowRight size={16}/></Link>
  </div>;
}
export function FavoritesPage(){return <MovieCollection kind="favorites"/>;}
export function HistoryPage(){return <MovieCollection kind="history"/>;}
