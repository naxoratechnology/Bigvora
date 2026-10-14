import {request} from '../api/client';

export const listSupportTickets = token => request('/support-tickets', {token});
export const createSupportTicket = (token, body) => request('/support-tickets', {method: 'POST', token, body});
export const listAdminSupportTickets = (token, status = 'all') => request(`/admin/support-tickets?status=${status}`, {token});
export const updateSupportTicketStatus = (token, id, status) => request(`/admin/support-tickets/${id}/status`, {method: 'PATCH', token, body: {status}});
