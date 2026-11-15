import {useEffect,useState} from 'react';
import {Users,Film,Heart,MessageCircle,Download,Activity,Shield,ChevronDown} from 'lucide-react';
import {api,getToken} from '../lib/api';
import {ErrorNote,Loader} from '../components/Loader';
type Stats={users:number,movies:number,series:number,favorites:number,reviews:number};
type ActivityDay={day:string,views:number};
type UserRow={id:string,email:string,name:string,role:'viewer'|'editor'|'admin',blocked:boolean,created_at:string};
type AuditRow={id:number,email:string|null,action:string,entity:string,created_at:string};
export function AdminPage(){
  const [stats,setStats]=useState<Stats|null>(null);const [activity,setActivity]=useState<ActivityDay[]>([]);
  const [users,setUsers]=useState<UserRow[]>([]);const [audits,setAudits]=useState<AuditRow[]>([]);
  const [error,setError]=useState('');const [notice,setNotice]=useState('');const [loading,setLoading]=useState(true);
  const reload=async()=>{try{const [dashboard,accounts,logs]=await Promise.all([
    api<{stats:Stats,activity:ActivityDay[]}>('/admin/dashboard'),api<UserRow[]>('/admin/users'),api<AuditRow[]>('/admin/audit')]);
    setStats(dashboard.stats);setActivity(dashboard.activity);setUsers(accounts);setAudits(logs);
  }catch(e){setError((e as Error).message);}finally{setLoading(false);}};
  useEffect(()=>{void reload();},[]);
  const modify=async(id:string,patch:Partial<Pick<UserRow,'role'|'blocked'>>)=>{try{
    await api(`/admin/users/${id}`,{method:'PATCH',body:JSON.stringify(patch)});setNotice('Изменения сохранены');await reload();
  }catch(e){setError((e as Error).message);}};
  const exportCsv=async()=>{try{const response=await fetch('/api/admin/export',{headers:{Authorization:`Bearer ${getToken()||''}`}});
    if(!response.ok)throw new Error('Не удалось выгрузить отчёт');const blob=await response.blob();const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='ciko-report.csv';link.click();URL.revokeObjectURL(url);
  }catch(e){setError((e as Error).message);}};
  const max=Math.max(1,...activity.map(d=>d.views));
  return <div className="container spaced admin-page"><span className="section-overline">CIKO / CONTROL CENTER</span><div className="page-title-row"><h1>Управление<span className="wine-dot">.</span></h1><button className="btn btn-outline" onClick={()=>void exportCsv()}><Download size={17}/> Экспорт CSV</button></div>
    {error&&<ErrorNote error={error}/>} {notice&&<div className="success-note">{notice}</div>}
    {loading?<Loader/>:<>
      <div className="stats-grid">{[
        {label:'Пользователей',value:stats?.users,icon:Users},{label:'Фильмов и сериалов',value:stats?.movies,icon:Film},
        {label:'Избранное',value:stats?.favorites,icon:Heart},{label:'Отзывов',value:stats?.reviews,icon:MessageCircle}
      ].map(s=><div className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><s.icon size={20}/></div><strong>{s.value??0}</strong><small>АКТУАЛЬНО</small></div>)}</div>
      <div className="admin-sections"><div className="panel"><div className="panel-heading"><h2><Activity size={21}/> Активность просмотра</h2><span>Последние 7 дней</span></div><div className="bar-chart" role="img" aria-label="Количество уникальных записей просмотра за последние семь дней">{activity.map(day=><div className="chart-col" key={day.day}><span className="chart-num">{day.views}</span><div className="chart-rail"><div className="chart-fill" style={{height:`${Math.max(4,day.views/max*100)}%`}}/></div><span>{day.day}</span></div>)}</div></div>
        <div className="panel"><div className="panel-heading"><h2><Shield size={20}/> Журнал аудита</h2></div><div className="audit-list">{audits.length?audits.slice(0,8).map(a=><div key={a.id}><span className="audit-mark"/><div><strong>{a.action}</strong><small>{a.email||'Системное действие'} · {new Date(a.created_at).toLocaleString('ru-RU')}</small></div></div>):<p className="muted">Пока нет действий.</p>}</div></div>
      </div>
      <section className="panel users-panel"><div className="panel-heading"><h2><Users size={21}/> Пользователи</h2><span>{users.length} записей</span></div><div className="table-scroll"><table><thead><tr><th>Пользователь</th><th>Роль</th><th>Статус</th><th>Блокировка</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><strong>{u.name}</strong><small>{u.email}</small></td><td><div className="role-select"><select aria-label={`Роль ${u.email}`} value={u.role} onChange={e=>void modify(u.id,{role:e.target.value as UserRow['role']})}><option value="viewer">Зритель</option><option value="editor">Редактор</option><option value="admin">Администратор</option></select><ChevronDown size={14}/></div></td><td><span className={u.blocked?'status-blocked':'status-active'}>{u.blocked?'Заблокирован':'Активен'}</span></td><td><button className="subtle-button" onClick={()=>void modify(u.id,{blocked:!u.blocked})}>{u.blocked?'Разблокировать':'Заблокировать'}</button></td></tr>)}</tbody></table></div></section>
    </>}
  </div>;
}
