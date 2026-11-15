import {useState,type FormEvent} from 'react';
import {Link,useLocation,useNavigate,useSearchParams} from 'react-router-dom';
import {Eye,EyeOff} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {api} from '../lib/api';
import {ErrorNote} from '../components/Loader';
export function AuthPage({register=false}:{register?:boolean}){
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');
  const [show,setShow]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [forgot,setForgot]=useState(false);
  const {login,register:signup}=useAuth();const navigate=useNavigate();const location=useLocation();
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{
    if(forgot){await api('/auth/forgot-password',{method:'POST',body:JSON.stringify({email})});setError('Ссылка восстановления появится в логах API, если почта существует.');return;}
    if(register)await signup(name,email,password);else await login(email,password);
    navigate((location.state as {from?:string}|null)?.from||'/',{replace:true});
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <div className="container simple-page auth-center"><div className="auth-box"><div className="tiny-label">CIKO / АККАУНТ</div><h1>{forgot?'Сброс пароля':register?'Регистрация':'Вход'}</h1>
    {error&&(forgot?<div className="success-note">{error}</div>:<ErrorNote error={error}/>)}
    <form className="form-stack" onSubmit={e=>void submit(e)}>{register&&!forgot&&<label>Имя<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Имя"/></label>}
      <label>Почта<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="mail@example.com"/></label>
      {!forgot&&<label>Пароль<div className="password-field"><input required minLength={8} autoComplete={register?'new-password':'current-password'} type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Минимум 8 символов"/><button type="button" aria-label="Показать пароль" onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>}
      <button className="btn btn-khaki full" disabled={busy}>{busy?'Проверяем...':forgot?'Получить ссылку':register?'Создать аккаунт':'Войти'}</button>
    </form>
    {!register&&<button className="subtle-button" onClick={()=>{setForgot(v=>!v);setError('');}}>{forgot?'Вернуться ко входу':'Забыли пароль?'}</button>}
    <div className="auth-switch">{register?<>Есть аккаунт? <Link to="/login">Войти</Link></>:<>Нет аккаунта? <Link to="/register">Регистрация</Link></>}</div>
  </div></div>;
}
export function ResetPage(){
  const [params]=useSearchParams();const [password,setPassword]=useState('');const [message,setMessage]=useState('');
  const submit=async(e:FormEvent)=>{e.preventDefault();try{await api('/auth/reset-password',{method:'POST',body:JSON.stringify({token:params.get('token'),password})});setMessage('Пароль обновлён. Теперь войдите.');}catch(e){setMessage((e as Error).message);}};
  return <div className="container simple-page auth-center"><div className="auth-box"><h1>Новый пароль</h1><form onSubmit={e=>void submit(e)} className="form-stack"><label>Пароль<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn btn-khaki">Сохранить</button></form>{message&&<p>{message}</p>}<Link className="text-link" to="/login">Войти</Link></div></div>;
}
