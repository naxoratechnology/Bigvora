import {request} from '../api/client';
export const getProfile=token=>request('/profile',{token});
export const updateProfile=(token,body)=>request('/profile',{method:'PATCH',token,body});
export const changePassword=(token,body)=>request('/profile/change-password',{method:'POST',token,body});
export const addAddress=(token,body)=>request('/profile/addresses',{method:'POST',token,body});
export const updateAddress=(token,id,body)=>request('/profile/addresses/'+id,{method:'PATCH',token,body});
export const removeAddress=(token,id)=>request('/profile/addresses/'+id,{method:'DELETE',token});
