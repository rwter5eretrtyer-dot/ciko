import {Link,NavLink} from 'react-router-dom';
import {LogOut,Menu,UserRound,X} from 'lucide-react';
import {useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {Logo} from './Logo';
export function Header(){
  const {user,logout}=useAuth();const [open,setOpen]=useState(false);const close=()=>setOpen(false);
  return <header className="header"><div className="header-inner container"><Link to="/" aria-label="Ciko" onClick={close}><Logo/></Link>
    <nav className={`header-nav ${open?'open':''}`} aria-label="Навигация"><NavLink end to="/" onClick={close}>Главная</NavLink><NavLink to="/catalog" onClick={close}>Каталог</NavLink><NavLink to="/rooms" onClick={close}>Комнаты</NavLink></nav>
    <div className="header-actions">{user?<><Link to="/profile" className="icon-btn" title="Профиль" aria-label="Профиль"><UserRound size={19}/></Link><button className="icon-btn desktop-icon" title="Выйти" aria-label="Выйти" onClick={()=>void logout()}><LogOut size={18}/></button></>:<Link className="login-link" to="/login">Войти</Link>}
      <button className="icon-btn menu-toggle" aria-label="Меню" onClick={()=>setOpen(v=>!v)}>{open?<X size={21}/>:<Menu size={21}/>}</button></div>
  </div></header>;
}
export function Footer(){return <footer className="footer"><div className="container footer-inner"><Logo/><span>Учебный проект · {new Date().getFullYear()}</span></div></footer>;}
