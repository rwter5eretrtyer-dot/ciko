import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {MovieCard} from './MovieCard';
import type {Movie} from '../lib/types';
const movie:Movie={id:'fa8ff461-f863-4b23-bd5a-cc3cba733f1f',title:'После света',description:'Короткий фильм',kind:'movie',release_year:2026,duration_minutes:3,age_rating:0,poster_url:null,backdrop_url:null,video_url:null,source_type:'external',published:true,genres:[],rating:4.6,created_at:new Date().toISOString()};
const renderCard=(onFavorite?:((id:string)=>void))=>render(<MemoryRouter><MovieCard movie={movie} onFavorite={onFavorite}/></MemoryRouter>);
describe('Карточка фильма',()=>{
  it('показывает название и год',()=>{renderCard();expect(screen.getAllByText('После света').length).toBeGreaterThan(0);expect(screen.getByText(/2026/)).toBeInTheDocument();});
  it('ведёт на правильный фильм',()=>{renderCard();expect(screen.getByRole('link',{name:'Открыть После света'})).toHaveAttribute('href',`/movie/${movie.id}`);});
  it('вызывает добавление в избранное',()=>{const onFavorite=vi.fn();renderCard(onFavorite);fireEvent.click(screen.getByRole('button',{name:'Добавить После света в избранное'}));expect(onFavorite).toHaveBeenCalledWith(movie.id);});
});
