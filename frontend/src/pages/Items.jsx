import React, { useEffect, useState } from 'react';
import api from '../api';
import { addLocal } from '../cartLocal';

export default function Items({ onCartChange }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  async function fetchItems() {
    const params = {};
    if (q) params.q = q;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    const { data } = await api.get('/items', { params });
    setItems(data);
  }

  useEffect(() => { fetchItems(); }, []);

  return (
    <div>
      <h2>Items</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} />
        <input placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)} />
        <input placeholder="Min price" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} />
        <input placeholder="Max price" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} />
        <button onClick={fetchItems}>Filter</button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((it) => (
          <div key={it.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
            <div style={{ fontWeight: 'bold' }}>{it.name}</div>
            <div>{it.category}</div>
            <div>${it.price.toFixed(2)}</div>
            <button onClick={() => { addLocal(it.id, 1); onCartChange(); }}>Add to cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
