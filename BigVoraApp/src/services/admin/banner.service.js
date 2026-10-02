import { request } from '../api/client';
const root = '/admin/banners';
export async function listBanners(token) {
  const data = await request(root, { token });
  return data.banners;
}
export async function createBanner(token, fields) {
  const data = await request(root, { method: 'POST', token, body: fields });
  return data.banner;
}
export async function updateBanner(token, id, fields, version) {
  const data = await request(`${root}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: { ...fields, version },
  });
  return data.banner;
}
export async function deleteBanner(token, id) {
  await request(`${root}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
}
