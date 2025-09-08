import api from './api';
import { getToken } from './auth';

const KEY = 'cart';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function write(obj) { localStorage.setItem(KEY, JSON.stringify(obj)); }
export function getLocalCart() { return read(); }
export function getLocalCartCount() {
  const c = read();
  return Object.values(c).reduce((a, b) => a + b, 0);
}
export function addLocal(itemId, delta = 1) {
  const c = read();
  c[itemId] = Math.max(0, (c[itemId] || 0) + delta);
  if (c[itemId] === 0) delete c[itemId];
  write(c);
}
export function setLocal(itemId, qty) {
  const c = read();
  if (qty <= 0) delete c[itemId]; else c[itemId] = qty;
  write(c);
}
export function removeLocal(itemId) {
  const c = read();
  delete c[itemId];
  write(c);
}

export async function mergeLocalCartToServer() {
  if (!getToken()) return;
  const local = read();
  const entries = Object.entries(local);
  for (const [itemId, qty] of entries) {
    await api.post('/cart', { itemId: Number(itemId), qty });
  }
  const { data } = await api.get('/cart');
  const merged = {};
  data.forEach((row) => { merged[row.itemId] = row.qty; });
  write(merged);
}
