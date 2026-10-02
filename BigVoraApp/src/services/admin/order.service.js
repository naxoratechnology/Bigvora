import { request } from '../api/client';

const root = '/admin/orders';

export async function listOrders(token) {
  const orders = [];
  let page = 1;
  let data;
  do {
    data = await request(`${root}?page=${page}&limit=100`, { token });
    orders.push(...data.orders);
    page += 1;
  } while (data.pagination?.hasMore);
  return orders;
}

export async function getOrder(token, id) {
  const data = await request(`${root}/${encodeURIComponent(id)}`, { token });
  return data.order;
}

export async function updateOrderStatus(token, id, status) {
  const data = await request(`${root}/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });
  return data.order;
}

export async function syncOrderShipment(token, id) {
  const data = await request(
    `${root}/${encodeURIComponent(id)}/sync-shipment`,
    { method: 'POST', token },
  );
  return data.order;
}
