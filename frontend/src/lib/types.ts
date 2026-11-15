export type Role='viewer'|'editor'|'admin';
export type User={id:string,name:string,email:string,role:Role,created_at?:string};
export type Genre={id:number,name:string,slug:string};
export type Movie={
  id:string,title:string,description:string,kind:'movie'|'series',release_year:number,
  duration_minutes:number,age_rating:number,poster_url:string|null,backdrop_url:string|null,
  video_url:string|null,source_type:'external'|'upload'|'embed',published:boolean,
  genres:Genre[],rating:string|number,created_at:string,
  progress_seconds?:number,completed?:boolean
};
export type PagedMovies={items:Movie[],total:number,page:number,limit:number,pages:number};
export type CikoResponse<T>={success:boolean,data:T,error?:{code:string,message:string}};
