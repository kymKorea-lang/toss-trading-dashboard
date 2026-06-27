import { apiGet, apiPost } from './auth.js';
export const getOrders = (status,sym,from,to) => {
  let path = `/api/v1/orders?status=${status}`;
  if(sym)  path+=`&symbol=${sym}`;
  if(from) path+=`&from=${from}`;
  if(to)   path+=`&to=${to}`;
  return apiGet(path, true);
};
export const getOrderDetail = id      => apiGet(`/api/v1/orders/${id}`, true);
export const createOrder    = body    => apiPost('/api/v1/orders', body);
export const modifyOrder    = (id,b)  => apiPost(`/api/v1/orders/${id}/modify`, b);
export const cancelOrder    = id      => apiPost(`/api/v1/orders/${id}/cancel`, {});
