import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      onLoggedIn(data.token);
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed');
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <h2>Login</h2>
      {err && <div style={{ color: 'red' }}>{err}</div>}
      <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
