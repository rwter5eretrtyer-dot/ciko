// Градиенты — запасные обложки, если пользователь ещё не загрузил постер.
const variants:[string,string][]=[['#4c282b','#131412'],['#5b5a43','#171815'],['#292f36','#101110'],['#514637','#191a17'],['#433a4a','#111211'],['#493322','#131411']];
export function posterColors(title:string,index=0){const sum=[...title].reduce((a,c)=>a+c.charCodeAt(0),index);const a=variants[sum%variants.length]!;return {background:`radial-gradient(ellipse at 72% 23%, ${a[0]} 0%,${a[1]} 75%)`};}
export const roleLabel={viewer:'Зритель',editor:'Редактор',admin:'Администратор'} as const;
