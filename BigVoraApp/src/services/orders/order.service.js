import {request} from '../api/client';
export const createCheckout=(token,body)=>request('/orders/checkout',{method:'POST',token,body});
export const verifyPayment=(token,body)=>request('/orders/verify-payment',{method:'POST',token,body});
export const listOrders=(token,{page=1,limit=20}={})=>request('/orders?page='+page+'&limit='+limit,{token});
