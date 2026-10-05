import {request} from '../api/client';

const root = '/admin/notifications';
export async function listNotifications(token) { const data = await request(root, {token}); return data.notifications; }
export async function createNotification(token, fields) { const data = await request(root, {method: 'POST', token, body: fields}); return data.notification; }
export async function updateNotification(token, id, fields, version) { const data = await request(`${root}/${encodeURIComponent(id)}`, {method: 'PATCH', token, body: {...fields, version}}); return data.notification; }
export function deleteNotification(token, id) { return request(`${root}/${encodeURIComponent(id)}`, {method: 'DELETE', token}); }
