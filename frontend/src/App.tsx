import {Routes,Route} from 'react-router-dom';
import {Header,Footer} from './components/Header';
import {Protected} from './components/Protected';
import {HomePage} from './pages/HomePage';
import {CatalogPage} from './pages/CatalogPage';
import {MoviePage} from './pages/MoviePage';
import {AuthPage,ResetPage} from './pages/AuthPage';
import {ProfilePage,FavoritesPage,HistoryPage} from './pages/ProfilePage';
import {StudioPage} from './pages/StudioPage';
import {AdminPage} from './pages/AdminPage';
import {RoomsPage} from './pages/RoomsPage';
import {RoomPage} from './pages/RoomPage';
export function App(){return <><Header/><main className="main-content"><Routes>
  <Route path="/" element={<HomePage/>}/><Route path="/catalog" element={<CatalogPage/>}/>
  <Route path="/rooms" element={<RoomsPage/>}/><Route path="/rooms/:id" element={<Protected><RoomPage/></Protected>}/>
  <Route path="/movie/:id" element={<MoviePage/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage register/>}/>
  <Route path="/reset-password" element={<ResetPage/>}/>
  <Route path="/profile" element={<Protected><ProfilePage/></Protected>}/>
  <Route path="/favorites" element={<Protected><FavoritesPage/></Protected>}/>
  <Route path="/history" element={<Protected><HistoryPage/></Protected>}/>
  <Route path="/studio" element={<Protected roles={['editor','admin']}><StudioPage/></Protected>}/>
  <Route path="/studio/:id" element={<Protected roles={['editor','admin']}><StudioPage/></Protected>}/>
  <Route path="/admin" element={<Protected roles={['admin']}><AdminPage/></Protected>}/>
  <Route path="*" element={<div className="container spaced"><h1>404</h1><p>Страница не найдена.</p></div>}/>
</Routes></main><Footer/></>}
