import {request} from '../api/client';

export async function listNotifications(token) {
  const data = await request('/notifications', {token});
  return data.notifications;
}

export function markAllNotificationsRead(token) {
  return request('/notifications/read-all', {method: 'POST', token});
}
