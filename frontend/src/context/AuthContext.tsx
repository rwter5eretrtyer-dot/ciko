import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {api,refreshSession,setToken} from '../lib/api';
import type {User} from '../lib/types';

type AuthType={user:User|null,loading:boolean,login:(email:string,password:string)=>Promise<void>,
  register:(name:string,email:string,password:string)=>Promise<void>,logout:()=>Promise<void>,reload:()=>Promise<void>};
const AuthContext=createContext<AuthType|null>(null);
export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(true);
  const reload=async()=>{setUser(await api<User>('/me'));};
  useEffect(()=>{let alive=true;(async()=>{
    const valid=await refreshSession();
    if(valid){try{const me=await api<User>('/me');if(alive)setUser(me);}catch{if(alive)setUser(null);}}
    if(alive)setLoading(false);
  })();return()=>{alive=false;};},[]);
  const login=async(email:string,password:string)=>{
    const result=await api<{accessToken:string,user:User}>('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
    setToken(result.accessToken);setUser(result.user);
  };
  const register=async(name:string,email:string,password:string)=>{
    const result=await api<{accessToken:string,user:User}>('/auth/register',{method:'POST',body:JSON.stringify({name,email,password})});
    setToken(result.accessToken);setUser(result.user);
  };
  const logout=async()=>{try{await api('/auth/logout',{method:'POST'});}finally{setToken(null);setUser(null);}};
  return <AuthContext.Provider value={{user,loading,login,register,logout,reload}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const auth=useContext(AuthContext);if(!auth)throw new Error('AuthProvider отсутствует');return auth;}
