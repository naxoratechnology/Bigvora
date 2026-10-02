import {request} from '../api/client';

export async function searchCatalog(filters={}){
  const entries=Object.entries(filters).filter(([,value])=>value!==undefined&&value!==null&&value!=='');
  const query=entries.map(([key,value])=>`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
  return request(`/catalog/search${query?`?${query}`:''}`);
}
