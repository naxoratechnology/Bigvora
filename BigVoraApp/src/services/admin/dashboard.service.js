import { request } from '../api/client';

export async function getDashboard(token) {
  return request('/admin/dashboard', { token });
}
