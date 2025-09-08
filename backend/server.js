import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const JWT_SECRET = 'change_me_in_prod';
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// DB setup
let db;
async function initDb() {
  db = await open({ filename: './ecommerce.db', driver: sqlite3.Database });
  await db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      image TEXT
    );
    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      cart_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      PRIMARY KEY (cart_id, item_id),
      FOREIGN KEY(cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE
    );
  `);
  const row = await db.get('SELECT COUNT(*) as c FROM items');
  if (row.c === 0) {
    const seed = [
      ['T-Shirt', 'Cotton tee', 19.99, 'Apparel', ''],
      ['Jeans', 'Blue denim', 49.99, 'Apparel', ''],
      ['Sneakers', 'Running shoes', 89.99, 'Footwear', ''],
      ['Mug', 'Ceramic coffee mug', 9.99, 'Home', '']
    ];
    const stmt = await db.prepare('INSERT INTO items(name,description,price,category,image) VALUES (?,?,?,?,?)');
    for (const s of seed) await stmt.run(...s);
    await stmt.finalize();
  }
}
await initDb();

// Helpers
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function getOrCreateCartId(userId) {
  let cart = await db.get('SELECT id FROM carts WHERE user_id = ?', userId);
  if (!cart) {
    const result = await db.run('INSERT INTO carts(user_id) VALUES (?)', userId);
    cart = { id: result.lastID };
  }
  return cart.id;
}

// Auth
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.run('INSERT INTO users(email, password_hash) VALUES (?,?)', email.toLowerCase(), hash);
    const token = jwt.sign({ id: result.lastID, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// Items CRUD with filters
app.get('/api/items', async (req, res) => {
  const { category, minPrice, maxPrice, q } = req.query;
  const clauses = [];
  const params = [];
  if (category) { clauses.push('category = ?'); params.push(category); }
  if (minPrice) { clauses.push('price >= ?'); params.push(Number(minPrice)); }
  if (maxPrice) { clauses.push('price <= ?'); params.push(Number(maxPrice)); }
  if (q) { clauses.push('(name LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const items = await db.all(`SELECT * FROM items ${where} ORDER BY id DESC`, params);
  res.json(items);
});

app.post('/api/items', authMiddleware, async (req, res) => {
  const { name, description = '', price, category, image = '' } = req.body || {};
  if (!name || price == null || !category) return res.status(400).json({ error: 'name, price, category required' });
  const result = await db.run('INSERT INTO items(name,description,price,category,image) VALUES (?,?,?,?,?)',
    name, description, Number(price), category, image);
  const item = await db.get('SELECT * FROM items WHERE id = ?', result.lastID);
  res.status(201).json(item);
});

app.put('/api/items/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await db.get('SELECT * FROM items WHERE id = ?', id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name = existing.name, description = existing.description, price = existing.price, category = existing.category, image = existing.image } = req.body || {};
  await db.run('UPDATE items SET name=?, description=?, price=?, category=?, image=? WHERE id=?',
    name, description, Number(price), category, image, id);
  const updated = await db.get('SELECT * FROM items WHERE id = ?', id);
  res.json(updated);
});

app.delete('/api/items/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM items WHERE id = ?', id);
  res.status(204).end();
});

// Cart APIs (authenticated)
app.get('/api/cart', authMiddleware, async (req, res) => {
  const cartId = await getOrCreateCartId(req.user.id);
  const rows = await db.all(`
    SELECT ci.item_id as itemId, ci.qty, i.name, i.price, i.category, i.image
    FROM cart_items ci
    JOIN items i ON i.id = ci.item_id
    WHERE ci.cart_id = ?`, cartId);
  res.json(rows);
});

app.post('/api/cart', authMiddleware, async (req, res) => {
  const { itemId, qty } = req.body || {};
  if (!itemId || !Number.isInteger(qty)) return res.status(400).json({ error: 'itemId and integer qty required' });
  const item = await db.get('SELECT id FROM items WHERE id = ?', itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const cartId = await getOrCreateCartId(req.user.id);
  const existing = await db.get('SELECT qty FROM cart_items WHERE cart_id=? AND item_id=?', cartId, itemId);
  const newQty = (existing?.qty || 0) + qty;
  if (newQty <= 0) {
    await db.run('DELETE FROM cart_items WHERE cart_id=? AND item_id=?', cartId, itemId);
  } else if (existing) {
    await db.run('UPDATE cart_items SET qty=? WHERE cart_id=? AND item_id=?', newQty, cartId, itemId);
  } else {
    await db.run('INSERT INTO cart_items(cart_id,item_id,qty) VALUES (?,?,?)', cartId, itemId, newQty);
  }
  const rows = await db.all('SELECT item_id as itemId, qty FROM cart_items WHERE cart_id=?', cartId);
  res.json(rows);
});

app.put('/api/cart/:itemId', authMiddleware, async (req, res) => {
  const { itemId } = req.params;
  const { qty } = req.body || {};
  if (!Number.isInteger(qty)) return res.status(400).json({ error: 'integer qty required' });
  const cartId = await getOrCreateCartId(req.user.id);
  if (qty <= 0) {
    await db.run('DELETE FROM cart_items WHERE cart_id=? AND item_id=?', cartId, itemId);
  } else {
    await db.run('INSERT INTO cart_items(cart_id,item_id,qty) VALUES (?,?,?) ON CONFLICT(cart_id,item_id) DO UPDATE SET qty=excluded.qty',
      cartId, itemId, qty);
  }
  const rows = await db.all('SELECT item_id as itemId, qty FROM cart_items WHERE cart_id=?', cartId);
  res.json(rows);
});

app.delete('/api/cart/:itemId', authMiddleware, async (req, res) => {
  const { itemId } = req.params;
  const cartId = await getOrCreateCartId(req.user.id);
  await db.run('DELETE FROM cart_items WHERE cart_id=? AND item_id=?', cartId, itemId);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
