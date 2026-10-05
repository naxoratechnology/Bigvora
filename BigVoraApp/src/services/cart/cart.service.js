import { request } from '../api/client';

export const listCart = token => request('/cart', { token });

export const setCartQuantity = (token, productId, quantity) =>
  request(`/cart/items/${productId}`, {
    method: 'PATCH',
    token,
    body: { quantity },
  });

export const clearCart = token => request('/cart', { method: 'DELETE', token });
