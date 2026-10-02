import {request} from '../api/client';
const root = '/admin/categories';
const present = category => ({
  ...category, products: String(category.products),
  updated: new Date(category.updated).toLocaleString(),
});
export async function listCategories(token) {
  const categories = [];
  let page = 1, data;
  do {
    data = await request(`${root}?page=${page}&limit=100`, {token});
    categories.push(...data.categories.map(present));
    page += 1;
  } while (data.hasMore);
  return categories;
}
export async function getCategory(token, id) {
  const data = await request(`${root}/${encodeURIComponent(id)}`, {token});
  return present(data.category);
}
export async function createCategory(token, fields) {
  const data = await request(root, {method: 'POST', token, body: fields});
  return present(data.category);
}
export async function updateCategory(token, id, fields, version) {
  const data = await request(`${root}/${encodeURIComponent(id)}`, {
    method: 'PATCH', token, body: {...fields, version},
  });
  return present(data.category);
}
export async function deleteCategory(token, id, version) {
  await request(`${root}/${encodeURIComponent(id)}`, {method: 'DELETE', token, body: {version}});
}
