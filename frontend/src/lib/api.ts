import type { CikoResponse } from './types';

// access-токен хранится в памяти, а refresh-токен — в HttpOnly cookie.
// JavaScript не может читать HttpOnly cookie: это защищает сессию от части XSS-атак.
let token:string|null=null;
let refreshPromise:Promise<boolean>|null=null;
export const setToken=(next:string|null)=>{token=next;};
export function getToken():string|null{return token;}
export async function refreshSession():Promise<boolean>{
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async()=>{
    try{const r=await fetch('/api/auth/refresh',{method:'POST',credentials:'include'});
      if(!r.ok){token=null;return false;}
      const json=await r.json() as CikoResponse<{accessToken:string}>;
      token=json.data.accessToken;return true;
    }catch{token=null;return false;}
  })().finally(()=>{refreshPromise=null;});
  return refreshPromise;
}
export async function api<T>(path:string,init:RequestInit={},retry=true):Promise<T>{
  const headers=new Headers(init.headers);
  if(!(init.body instanceof FormData)&&init.body)headers.set('Content-Type','application/json');
  if(token)headers.set('Authorization',`Bearer ${token}`);
  const response=await fetch('/api'+path,{...init,headers,credentials:'include'});
  if(response.status===401&&retry&&!path.startsWith('/auth/')&&await refreshSession())return api<T>(path,init,false);
  const result=await response.json() as CikoResponse<T>;
  if(!response.ok||!result.success)throw new Error(result.error?.message||'Не удалось выполнить запрос');
  return result.data;
}
export async function uploadFile(file:File,kind:'image'|'video'):Promise<{url:string,size:number}>{
  const form=new FormData();form.append('file',file);
  return api<{url:string,size:number}>(`/uploads?kind=${kind}`,{method:'POST',body:form});
}
