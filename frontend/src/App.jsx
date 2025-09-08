import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Items from './pages/Items.jsx';
import Cart from './pages/Cart.jsx';
import { getToken, setToken, clearToken } from './auth.js';
import { mergeLocalCartToServer, getLocalCartCount } from './cartLocal.js';

export default function App() {
  const [token, setTok] = useState(getToken());
  const [cartCount, setCartCount] = useState(getLocalCartCount());
  const nav = useNavigate();

  useEffect(() => {
    const onStorage = () => setCartCount(getLocalCartCount());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  async function handleLoggedIn(t) {
    setTok(t);
    setToken(t);
    try { await mergeLocalCartToServer(); } catch {}
    setCartCount(getLocalCartCount());
    nav('/');
  }

  function handleLogout() {
    clearToken();
    setTok(null);
    nav('/');
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link to="/">Items</Link>
        <Link to="/cart">Cart ({cartCount})</Link>
        {token ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Items onCartChange={() => setCartCount(getLocalCartCount())} />} />
        <Route path="/cart" element={<Cart onCartChange={() => setCartCount(getLocalCartCount())} />} />
        <Route path="/login" element={<Login onLoggedIn={handleLoggedIn} />} />
        <Route path="/signup" element={<Signup onLoggedIn={handleLoggedIn} />} />
      </Routes>
    </div>
  );
}
