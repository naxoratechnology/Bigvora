import { request } from '../api/client';

const root = '/admin/customers';

export async function listCustomers(token) {
  const customers = [];
  let page = 1;
  let data;
  do {
    data = await request(`${root}?page=${page}&limit=100`, { token });
    customers.push(...data.customers);
    page += 1;
  } while (data.pagination?.hasMore);
  return customers;
}

export async function getCustomer(token, id) {
  const data = await request(`${root}/${encodeURIComponent(id)}`, { token });
  return data.customer;
}

export async function updateCustomerStatus(token, id, isActive) {
  const data = await request(`${root}/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    token,
    body: {isActive},
  });
  return data.customer;
}

export function deleteCustomer(token, id) {
  return request(`${root}/${encodeURIComponent(id)}`, {method: 'DELETE', token});
}
