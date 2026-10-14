import {request} from '../api/client';
export const rateProduct=(token,productId,rating)=>request(`/reviews/${productId}`,{method:'PUT',token,body:{rating}});
