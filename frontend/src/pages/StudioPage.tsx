import {useEffect,useState,type FormEvent} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {ArrowLeft,ArrowRight,Film,FileVideo,Image as ImageIcon,Plus,Trash2,UploadCloud} from 'lucide-react';
import {api,uploadFile} from '../lib/api';
import type {Genre,Movie} from '../lib/types';
import {Empty,ErrorNote,Loader} from '../components/Loader';
const defaults={title:'',description:'',kind:'movie' as 'movie'|'series',releaseYear:2026,durationMinutes:90,ageRating:12,posterUrl:'',backdropUrl:'',videoUrl:'',published:true,genreIds:[] as number[]};
type FormDataModel=typeof defaults;
export function StudioPage(){
  const {id}=useParams();const navigate=useNavigate();const [movies,setMovies]=useState<Movie[]>([]);const [genres,setGenres]=useState<Genre[]>([]);
  const [form,setForm]=useState<FormDataModel>({...defaults,genreIds:[]});const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [loading,setLoading]=useState(true);
  useEffect(()=>{api<Genre[]>('/movies/genres').then(setGenres).catch(()=>{});},[]);
  const reload=()=>api<Movie[]>('/studio/movies').then(setMovies).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  useEffect(()=>{void reload();},[]);
  useEffect(()=>{if(!id){setForm({...defaults,genreIds:[]});return;}api<Movie>(`/studio/movies/${id}`).then(m=>setForm({
    title:m.title,description:m.description,kind:m.kind,releaseYear:m.release_year,durationMinutes:m.duration_minutes,ageRating:m.age_rating,
    posterUrl:m.poster_url||'',backdropUrl:m.backdrop_url||'',videoUrl:m.video_url||'',published:m.published,genreIds:m.genres.map(g=>g.id)
  })).catch(e=>setError(e.message));},[id]);
  const set=<K extends keyof FormDataModel>(key:K,value:FormDataModel[K])=>setForm(o=>({...o,[key]:value}));
  const upload=async(file:File|null,kind:'video'|'image')=>{if(!file)return;setBusy(true);setError('');try{
    const result=await uploadFile(file,kind);set(kind==='video'?'videoUrl':'posterUrl',result.url);setNotice(`Файл загружен (${Math.round(result.size/1024)} КБ). Не забудьте сохранить карточку.`);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const save=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{
    const payload={...form,posterUrl:form.posterUrl||null,backdropUrl:form.backdropUrl||null,videoUrl:form.videoUrl||null,sourceType:'external'};
    await api(`/movies${id?'/'+id:''}`,{method:id?'PUT':'POST',body:JSON.stringify(payload)});
    setNotice(id?'Фильм обновлён':'Фильм добавлен');await reload();navigate('/studio');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const remove=async(movie:Movie)=>{if(!window.confirm(`Удалить «${movie.title}» без возможности восстановления?`))return;
    try{await api(`/movies/${movie.id}`,{method:'DELETE'});await reload();setNotice('Карточка удалена');}catch(e){setError((e as Error).message);}};
  return <div className="container spaced studio-page"><span className="section-overline">CIKO / КОНТЕНТ-МЕНЕДЖМЕНТ</span><div className="page-title-row"><h1>Студия<span className="wine-dot">.</span></h1><p>Добавляйте фильмы, постеры и видео.</p></div>
    {error&&<ErrorNote error={error}/>} {notice&&<div className="success-note">{notice}</div>}
    <div className="studio-layout"><div className="studio-list"><div className="panel-heading"><h2>Каталог ({movies.length})</h2><Link className="btn btn-wine compact" to="/studio"><Plus size={16}/> Добавить</Link></div>
      {loading?<Loader/>:movies.length?movies.map(m=><div className="studio-item" key={m.id}><div className="studio-thumb"><Film size={20}/></div><div><strong>{m.title}</strong><span>{m.release_year} · {m.published?'Опубликован':'Черновик'}</span></div><Link to={`/studio/${m.id}`} className="text-link">Изменить <ArrowRight size={14}/></Link><button className="icon-btn small" aria-label={`Удалить ${m.title}`} onClick={()=>void remove(m)}><Trash2 size={15}/></button></div>):<Empty title="Здесь пока пусто"/>}
    </div><form className="panel studio-form form-stack" onSubmit={e=>void save(e)}><div className="panel-heading"><h2>{id?'Редактировать':'Новый фильм'}</h2>{id&&<Link to="/studio" className="subtle-button"><ArrowLeft size={15}/> Новый</Link>}</div>
      <label>Название<input required minLength={2} maxLength={200} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Название"/></label>
      <label>Описание<textarea maxLength={12000} rows={4} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Краткое описание"/></label>
      <div className="form-row"><label>Тип<select value={form.kind} onChange={e=>set('kind',e.target.value as 'movie'|'series')}><option value="movie">Фильм</option><option value="series">Сериал</option></select></label><label>Год<input type="number" min="1888" max="2200" value={form.releaseYear} onChange={e=>set('releaseYear',Number(e.target.value))}/></label></div>
      <div className="form-row"><label>Длительность, мин<input type="number" min="1" value={form.durationMinutes} onChange={e=>set('durationMinutes',Number(e.target.value))}/></label><label>Возраст<select value={form.ageRating} onChange={e=>set('ageRating',Number(e.target.value))}>{[0,6,12,16,18].map(n=><option key={n} value={n}>{n}+</option>)}</select></label></div>
      <label>Жанры <div className="genre-checkboxes">{genres.map(g=><label className="check-label" key={g.id}><input type="checkbox" checked={form.genreIds.includes(g.id)} onChange={e=>set('genreIds',e.target.checked?[...form.genreIds,g.id]:form.genreIds.filter(x=>x!==g.id))}/>{g.name}</label>)}</div></label>
      <div className="upload-zone"><label className="upload-tile"><FileVideo size={24}/><strong>Загрузить видео</strong><span>MP4, WebM, OGG · до 512 МБ</span><input type="file" accept=".mp4,.webm,.ogg,video/mp4,video/webm,video/ogg" onChange={e=>void upload(e.target.files?.[0]||null,'video')}/></label>
        <label className="upload-tile"><ImageIcon size={24}/><strong>Загрузить постер</strong><span>JPG, PNG, WebP · до 8 МБ</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void upload(e.target.files?.[0]||null,'image')}/></label></div>
      <label>Или вставить ссылку на видео<input value={form.videoUrl} onChange={e=>set('videoUrl',e.target.value)} placeholder="https://.../video.mp4 или YouTube/Vimeo"/><small>Возможны прямые MP4/WebM/OGG и ссылки YouTube/Vimeo. Убедитесь, что у вас есть права на публикацию.</small></label>
      <label>Ссылка на постер<input value={form.posterUrl} onChange={e=>set('posterUrl',e.target.value)} placeholder="https://.../poster.jpg или загруженный файл"/></label>
      <label className="check-label"><input type="checkbox" checked={form.published} onChange={e=>set('published',e.target.checked)}/>Опубликовать в каталоге</label>
      {form.videoUrl&&<div className="file-indicator"><UploadCloud size={16}/> Видео: {form.videoUrl.length>60?form.videoUrl.slice(0,60)+'…':form.videoUrl}</div>}
      <button className="btn btn-khaki full" disabled={busy}>{busy?'Загрузка / сохранение...':id?'Сохранить изменения':'Создать фильм'} <ArrowRight size={16}/></button>
    </form></div>
  </div>;
}
