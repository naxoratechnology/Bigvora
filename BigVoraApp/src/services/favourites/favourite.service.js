import {request} from '../api/client';
export const listFavourites = token => request('/favourites', {token});
export const addFavourite = (token, productId) => request('/favourites/' + productId, {method: 'POST', token});
export const removeFavourite = (token, productId) => request('/favourites/' + productId, {method: 'DELETE', token});
