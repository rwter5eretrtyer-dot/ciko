import {Navigate,useLocation} from 'react-router-dom';
import type {ReactNode} from 'react';
import type {Role} from '../lib/types';
import {useAuth} from '../context/AuthContext';
import {Loader} from './Loader';
export function Protected({children,roles}:{children:ReactNode,roles?:Role[]}){
  const {user,loading}=useAuth();const location=useLocation();
  if(loading)return <Loader/>;
  if(!user)return <Navigate to="/login" replace state={{from:location.pathname}}/>;
  if(roles&&!roles.includes(user.role))return <Navigate to="/" replace/>;
  return <>{children}</>;
}
