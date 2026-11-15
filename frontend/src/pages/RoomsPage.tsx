import {useEffect,useState,type FormEvent} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {ArrowRight,Copy,Plus,Upload} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {api,uploadFile} from '../lib/api';
import type {Movie,PagedMovies} from '../lib/types';
import {Loader,ErrorNote} from '../components/Loader';

type RoomListItem={id:string,code:string,title:string,owner_id:string,video_title:string,member_count:number,created_at:string};

export function RoomsPage(){
  const {user}=useAuth();const navigate=useNavigate();const [params]=useSearchParams();
  const [mine,setMine]=useState<RoomListItem[]>([]);const [films,setFilms]=useState<Movie[]>([]);
  const [title,setTitle]=useState('');const [movieId,setMovieId]=useState(params.get('movieId')||'');const [videoUrl,setVideoUrl]=useState('');
  const [code,setCode]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const [notice,setNotice]=useState('');
  const load=()=>api<RoomListItem[]>('/rooms/mine').then(setMine).catch(e=>setError((e as Error).message)).finally(()=>setLoading(false));
  useEffect(()=>{if(!user)return;void load();api<PagedMovies>('/movies?limit=48').then(data=>setFilms(data.items.filter(m=>!!m.video_url))).catch(()=>{});},[user]);
  const create=async(e:FormEvent)=>{e.preventDefault();setError('');setBusy(true);
    try{const newRoom=await api<{id:string}>('/rooms',{method:'POST',body:JSON.stringify({title,movieId:movieId||null,videoUrl:movieId?null:videoUrl||null})});navigate(`/rooms/${newRoom.id}`);}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const join=async(e:FormEvent)=>{e.preventDefault();setError('');setBusy(true);
    try{const room=await api<{id:string}>('/rooms/join',{method:'POST',body:JSON.stringify({code:code.trim().toUpperCase()})});navigate(`/rooms/${room.id}`);}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const upload=async(file:File|undefined)=>{if(!file)return;setBusy(true);setError('');setNotice('');
    try{const fileData=await uploadFile(file,'video');setMovieId('');setVideoUrl(fileData.url);setNotice('Видео загружено. Теперь создайте комнату.');}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  if(!user)return <div className="container simple-page"><div className="simple-header"><h1>Комнаты</h1><p>Для совместного просмотра нужен аккаунт.</p></div><Link to="/login" className="btn btn-khaki">Войти</Link></div>;
  return <div className="container simple-page rooms-page">
    <div className="simple-header"><div><div className="tiny-label">CIKO / ROOMS</div><h1>Комнаты</h1><p>Смотрите вместе. Приглашайте по коду.</p></div></div>
    {error&&<ErrorNote error={error}/>} {notice&&<div className="success-note">{notice}</div>}
    <div className="room-columns">
      <form className="panel form-stack" onSubmit={e=>void create(e)}><h2><Plus size={20}/> Новая комната</h2>
        <label>Название<input required minLength={2} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Например, Кино вечером"/></label>
        <label>Фильм из каталога<select value={movieId} onChange={e=>{setMovieId(e.target.value);if(e.target.value)setVideoUrl('');}}>
          <option value="">Своё видео или ссылка</option>{films.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}
        </select></label>
        {!movieId&&<><label>Ссылка на видео<input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="https://.../video.mp4 или YouTube"/><small>Прямая MP4, WebM, OGG или ссылка YouTube/Vimeo.</small></label>
          <label className="upload-line"><Upload size={17}/><span>Загрузить своё видео (до 512 МБ)</span><input type="file" accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg" onChange={e=>void upload(e.target.files?.[0])}/></label></>}
        <button className="btn btn-khaki full" disabled={busy||!title.trim()||(!movieId&&!videoUrl.trim())}>{busy?'Сохраняем...':'Создать комнату'} <ArrowRight size={16}/></button>
      </form>
      <div className="room-sidebar"><form className="panel form-stack" onSubmit={e=>void join(e)}><h2>Войти по коду</h2><label>Код комнаты<input value={code} onChange={e=>setCode(e.target.value.replace(/\s/g,'').toUpperCase())} placeholder="A1B2C3D4E5" maxLength={10}/></label><button className="btn btn-outline full" disabled={busy||code.length!==10}>Присоединиться</button></form>
        <div className="panel"><h2>Мои комнаты</h2>{loading?<Loader/>:mine.length?mine.map(r=><Link className="room-item" key={r.id} to={`/rooms/${r.id}`}><div><strong>{r.title}</strong><span>{r.member_count} участников · {r.code}</span></div><ArrowRight size={17}/></Link>):<p className="muted">Комнат пока нет. Создайте первую.</p>}</div>
        <div className="room-tip"><Copy size={17}/><span>Отправьте код другу. Чтобы войти, ему нужен аккаунт Ciko.</span></div>
      </div>
    </div>
  </div>;
}
