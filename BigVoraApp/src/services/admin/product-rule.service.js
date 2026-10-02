import {request} from '../api/client';

const root='/admin/product-rules';
export async function listProductRules(token){const data=await request(root,{token});return data.rules;}
export async function createProductRule(token,fields){const data=await request(root,{method:'POST',token,body:fields});return data.rule;}
export async function updateProductRule(token,id,fields,version){const data=await request(`${root}/${encodeURIComponent(id)}`,{method:'PATCH',token,body:{...fields,version}});return data.rule;}
export async function deleteProductRule(token,id){await request(`${root}/${encodeURIComponent(id)}`,{method:'DELETE',token});}
