import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {ArrowLeft,Copy,Play,Pause,Send,Trash2,Volume2,VolumeX} from 'lucide-react';
import {api} from '../lib/api';
import {useAuth} from '../context/AuthContext';
import {Loader,ErrorNote} from '../components/Loader';

type Member={id:string,name:string};
type Room={id:string,code:string,owner_id:string,owner_name:string,title:string,movie_title:string|null,
  playable_url:string|null,playable_source_type:'external'|'upload'|'embed'|null,
  seconds:number,playing:boolean,member_count:number,members:Member[]};
type Message={id:number,body:string,name:string,created_at:string};

export function RoomPage(){
  const {id}=useParams();const navigate=useNavigate();const {user}=useAuth();
  const [room,setRoom]=useState<Room|null>(null);const [messages,setMessages]=useState<Message[]>([]);
  const [draft,setDraft]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const [sound,setSound]=useState(false);const [needsPlay,setNeedsPlay]=useState(false);const [notice,setNotice]=useState('');
  const videoRef=useRef<HTMLVideoElement>(null);const suppress=useRef(false);const suppressTimeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  const isHost=!!room&&room.owner_id===user?.id;
  // Гости сверяют позицию с сервером. Создатель управляет play, pause и перемоткой.
  const load=useCallback(async()=>{
    if(!id)return;
    try{const data=await api<Room>(`/rooms/${id}`);setRoom(data);setError('');
      if(user?.id===data.owner_id||data.playable_source_type==='embed')return;
      const video=videoRef.current;if(!video||!video.duration)return;
      const expected=Math.max(0,data.seconds);
      if(Math.abs(video.currentTime-expected)>2.5){suppress.current=true;video.currentTime=expected;}
      if(data.playing&&video.paused){suppress.current=true;void video.play().then(()=>setNeedsPlay(false)).catch(()=>setNeedsPlay(true));}
      if(!data.playing&&!video.paused){suppress.current=true;video.pause();}
      if(suppressTimeout.current)clearTimeout(suppressTimeout.current);
      suppressTimeout.current=setTimeout(()=>{suppress.current=false;},500);
    }catch(e){setError((e as Error).message);}
  },[id,user?.id]);
  const loadMessages=useCallback(async()=>{if(!id)return;try{setMessages(await api<Message[]>(`/rooms/${id}/messages`));}catch{/* При недоступности сети оставляем последние сообщения. */}},[id]);
  useEffect(()=>{void load();void loadMessages();const timer=setInterval(()=>{void load();void loadMessages();},2500);return()=>{clearInterval(timer);if(suppressTimeout.current)clearTimeout(suppressTimeout.current);};},[load,loadMessages]);
  const sendState=async(playing:boolean)=>{if(!id||!isHost||suppress.current||!videoRef.current)return;
    try{await api(`/rooms/${id}/state`,{method:'PUT',body:JSON.stringify({playing,seconds:videoRef.current.currentTime||0})});}
    catch(e){setNotice((e as Error).message);}};
  const sendMessage=async(e:FormEvent)=>{e.preventDefault();if(!draft.trim()||!id)return;setBusy(true);
    try{await api(`/rooms/${id}/messages`,{method:'POST',body:JSON.stringify({body:draft})});setDraft('');await loadMessages();}
    catch(e){setNotice((e as Error).message);}finally{setBusy(false);}};
  const remove=async()=>{if(!id||!window.confirm('Удалить комнату и всю переписку?'))return;
    try{await api(`/rooms/${id}`,{method:'DELETE'});navigate('/rooms');}catch(e){setNotice((e as Error).message);}};
  const leave=async()=>{if(!id)return;try{await api(`/rooms/${id}/leave`,{method:'POST'});navigate('/rooms');}catch(e){setNotice((e as Error).message);}};
  const copy=async()=>{if(!room)return;try{await navigator.clipboard.writeText(room.code);setNotice('Код скопирован');}catch{setNotice(`Код: ${room.code}`);}};
  const activateSound=()=>{const video=videoRef.current;if(video){video.muted=false;setSound(true);if(room?.playing)void video.play().catch(()=>setNeedsPlay(true));}};
  if(error&&!room)return <div className="container simple-page"><Link className="back-link" to="/rooms"><ArrowLeft size={15}/> К комнатам</Link><ErrorNote error={error}/></div>;
  if(!room)return <Loader/>;
  const embed=room.playable_source_type==='embed';
  return <div className="container simple-page room-detail">
    <Link className="back-link" to="/rooms"><ArrowLeft size={16}/> Комнаты</Link>
    <div className="room-top"><div><div className="tiny-label">КОМНАТА / {room.code}</div><h1>{room.title}</h1><p>{room.movie_title||'Своё видео'} · {room.member_count} участников</p></div>
      <div className="room-buttons"><button className="btn btn-outline" onClick={()=>void copy()}><Copy size={15}/> Код</button>{isHost?<button className="icon-btn" aria-label="Удалить комнату" title="Удалить комнату" onClick={()=>void remove()}><Trash2 size={18}/></button>:<button className="btn btn-outline" onClick={()=>void leave()}>Выйти</button>}</div>
    </div>
    {notice&&<div role="status" className="success-note">{notice}</div>}
    <div className="watch-layout"><div className="watch-main">
      <div className="watch-player">{room.playable_url?(embed?
        <iframe title={room.title} src={room.playable_url} referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; picture-in-picture; encrypted-media" allowFullScreen/>:
        <video ref={videoRef} src={room.playable_url} controls={isHost} autoPlay={false} muted={!sound} playsInline preload="metadata"
          onLoadedMetadata={()=>{const v=videoRef.current;if(!v)return;v.currentTime=room.seconds;if(!isHost&&room.playing)void v.play().catch(()=>setNeedsPlay(true));}}
          onPlay={()=>void sendState(true)} onPause={()=>void sendState(false)} onSeeked={()=>void sendState(!videoRef.current?.paused)}/>):
        <p>Видео не выбрано.</p>}
      </div>
      {!embed&&<div className="room-controls"><div className="room-playing">{room.playing?<><Play size={15}/> Идёт просмотр</>:<><Pause size={15}/> Пауза</>}{isHost&&<span>Вы управляете просмотром.</span>}</div>
        {!isHost&&<div className="room-buttons"><button className="btn btn-outline compact" onClick={activateSound}>{sound?<Volume2 size={16}/>:<VolumeX size={16}/>} {needsPlay?'Начать просмотр':'Включить звук'}</button></div>}</div>}
      {embed&&<p className="room-footnote">Встроенное видео запускается у каждого отдельно. Общая пауза и перемотка работают для MP4, WebM и OGG.</p>}
      <div className="panel members-panel"><h2>Участники</h2><div className="members-list">{room.members.map(m=><span key={m.id}>{m.name}{m.id===room.owner_id?' · создатель':''}</span>)}</div></div>
    </div><aside className="room-chat"><div className="chat-head"><h2>Чат</h2><span>{messages.length} сообщений</span></div><div className="chat-messages" aria-live="polite">{messages.length?messages.map(m=><div className="chat-message" key={m.id}><strong>{m.name}</strong><p>{m.body}</p></div>):<p className="muted">Пока нет сообщений.</p>}</div><form onSubmit={e=>void sendMessage(e)} className="chat-input"><input aria-label="Сообщение" maxLength={500} value={draft} placeholder="Сообщение" onChange={e=>setDraft(e.target.value)}/><button className="icon-btn" aria-label="Отправить" disabled={busy||!draft.trim()}><Send size={19}/></button></form></aside></div>
  </div>;
}
