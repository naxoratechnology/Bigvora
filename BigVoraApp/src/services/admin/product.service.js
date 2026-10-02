import {request} from '../api/client';

const root = '/admin/products';
const present = product => ({
  ...product,
  price: String(product.price), mrp: String(product.mrp ?? product.price), costPrice: String(product.costPrice),
  stock: String(product.stock), reorderLevel: String(product.reorderLevel),
  updated: new Date(product.updated).toLocaleString(),
});
export async function listProducts(token) {
  const products = [];
  let page = 1;
  let data;
  do {
    data = await request(`${root}?page=${page}&limit=100`, {token});
    products.push(...data.products.map(present));
    page += 1;
  } while (data.hasMore);
  return products;
}
export async function getProduct(token, id) {
  const data = await request(`${root}/${encodeURIComponent(id)}`, {token});
  return present(data.product);
}
export async function createProduct(token, fields) {
  const data = await request(root, {method: 'POST', token, body: fields});
  return present(data.product);
}
export async function updateProduct(token, id, fields, version) {
  const data = await request(`${root}/${encodeURIComponent(id)}`, {
    method: 'PATCH', token, body: {...fields, version},
  });
  return present(data.product);
}
export async function deleteProduct(token, id, version) {
  await request(`${root}/${encodeURIComponent(id)}`, {
    method: 'DELETE', token, body: {version},
  });
}
export async function adjustProductStock(token, id, quantity, reason) {
  const data = await request(`${root}/${encodeURIComponent(id)}/stock`, {
    method: 'PATCH', token, body: {quantity, reason},
  });
  return present(data.product);
}
