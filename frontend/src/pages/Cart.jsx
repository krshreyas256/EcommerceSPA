import React, { useEffect, useState } from 'react';
import api from '../api';
import { getLocalCart, setLocal } from '../cartLocal';
import { getToken } from '../auth';

export default function Cart({ onCartChange }) {
  const [lines, setLines] = useState([]);

  async function load() {
    const local = getLocalCart();
    const { data: all } = await api.get('/items');
    const rows = Object.entries(local).map(([itemId, qty]) => {
      const it = all.find(i => i.id === Number(itemId));
      return { itemId: Number(itemId), qty, name: it?.name || 'Unknown', price: it?.price || 0, category: it?.category || '' };
    });
    setLines(rows);
  }

  useEffect(() => { load(); }, []);

  async function updateQty(itemId, qty) {
    setLocal(itemId, qty);
    if (getToken()) {
      if (qty <= 0) await api.delete(`/cart/${itemId}`);
      else await api.put(`/cart/${itemId}`, { qty });
    }
    await load();
    onCartChange();
  }

  const total = lines.reduce((s, r) => s + r.price * r.qty, 0);

  return (
    <div>
      <h2>Cart</h2>
      {lines.length === 0 ? <div>Your cart is empty.</div> : (
        <>
          {lines.map(r => (
            <div key={r.itemId} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #eee', padding: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{r.name}</div>
                <div>${r.price.toFixed(2)}</div>
              </div>
              <div>
                <button onClick={() => updateQty(r.itemId, r.qty - 1)}>-</button>
                <span style={{ margin: '0 8px' }}>{r.qty}</span>
                <button onClick={() => updateQty(r.itemId, r.qty + 1)}>+</button>
              </div>
              <button onClick={() => updateQty(r.itemId, 0)}>Remove</button>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 'bold' }}>Total: ${total.toFixed(2)}</div>
        </>
      )}
    </div>
  );
}
