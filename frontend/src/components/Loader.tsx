export function Loader(){return <div role="status" className="loader">Загружаем коллекцию<span className="pulse-dots">...</span></div>;}
export function Empty({title='Пока ничего нет',description='Попробуйте изменить фильтры.'}:{title?:string,description?:string}){return <div className="empty"><span className="empty-mark">∅</span><h3>{title}</h3><p>{description}</p></div>;}
export function ErrorNote({error}:{error:string}){return <div role="alert" className="error-note">{error}</div>;}
