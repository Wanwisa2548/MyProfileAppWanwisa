const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = Number(process.env.PORT) || 3038;

const requiredConfig = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingConfig = requiredConfig.filter((name) => !process.env[name]);

if (missingConfig.length) {
  throw new Error(`Missing database configuration: ${missingConfig.join(', ')}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

app.use(cors({ origin: true }));
app.use(express.json({ limit: '25mb' }));

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication is required' });
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Your session is invalid or has expired' });
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin') return res.status(403).json({ error: 'Access restricted to administrators' });
  next();
}

const productColumns = 'id, created_at, name, brand, category, price, oldPrice, rating, image, is_active';

function productPayload(body) {
  const { name, brand, category, image, price, oldPrice, old_price, rating, is_active } = body;
  return {
    ...(name !== undefined && { name }),
    ...(brand !== undefined && { brand }),
    ...(category !== undefined && { category }),
    ...(image !== undefined && { image }),
    ...(price !== undefined && { price: Number(price) || 0 }),
    ...((oldPrice !== undefined || old_price !== undefined) && {
      oldPrice: oldPrice ?? old_price ?? null,
    }),
    ...(rating !== undefined && { rating: Number(rating) || 5 }),
    ...(is_active !== undefined && { is_active: Number(Boolean(is_active)) }),
  };
}

function placeholdersFor(payload) {
  const entries = Object.entries(payload);
  return {
    columns: entries.map(([key]) => `\`${key}\``).join(', '),
    values: entries.map(([, value]) => value),
    updates: entries.map(([key]) => `\`${key}\` = ?`).join(', '),
  };
}

app.get('/', (req, res) => {
  res.send('Backend is running with MySQL.');
});

app.get('/api/health/database', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ database: 'connected' });
  } catch (err) {
    console.error('Database health check failed:', err);
    res.status(503).json({ database: 'unavailable' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username?.trim() || !password || !['customer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'username, password, and a valid requested role are required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = ? LIMIT 1',
      [username.trim()]
    );
    const account = rows[0];
    if (!account || !(await bcrypt.compare(password, account.password_hash))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    if (account.role !== role) {
      return res.status(403).json({ error: 'Unauthorized: Access restricted to Administrators' });
    }

    const token = jwt.sign(
      { userId: account.id, username: account.username, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: String(account.id), username: account.username, email: account.email, role: account.role } });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(503).json({ error: 'The authentication service is temporarily unavailable. Please try again later.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, \'customer\')',
      [username.trim(), email.trim(), passwordHash]
    );
    const user = { id: String(result.insertId), username: username.trim(), email: email.trim(), role: 'customer' };
    const token = jwt.sign({ userId: result.insertId, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This username or email is already in use' });
    console.error('Registration failed:', err);
    res.status(503).json({ error: 'The registration service is temporarily unavailable. Please try again later.' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${productColumns} FROM products WHERE is_active = 1 ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin inventory endpoint: includes both active and inactive products.
app.get('/api/admin/products', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${productColumns} FROM products ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticate, requireAdmin, async (req, res) => {
  try {
    const payload = productPayload(req.body);
    const { columns, values } = placeholdersFor(payload);
    const [result] = await pool.execute(
      `INSERT INTO products (${columns}) VALUES (${values.map(() => '?').join(', ')})`,
      values
    );
    const [rows] = await pool.execute(`SELECT ${productColumns} FROM products WHERE id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const payload = productPayload(req.body);
    const { updates, values } = placeholdersFor(payload);
    if (!updates) return res.status(400).json({ error: 'No product fields provided' });

    const [result] = await pool.execute(`UPDATE products SET ${updates} WHERE id = ?`, [...values, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found in database' });

    const [rows] = await pool.execute(`SELECT ${productColumns} FROM products WHERE id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    if (typeof req.body.is_active !== 'boolean' && req.body.is_active !== 0 && req.body.is_active !== 1) {
      return res.status(400).json({ error: 'is_active must be true or false' });
    }

    const isActive = Number(Boolean(req.body.is_active));
    const [result] = await pool.execute('UPDATE products SET is_active = ? WHERE id = ?', [isActive, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found in database' });

    const [rows] = await pool.execute(`SELECT ${productColumns} FROM products WHERE id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found in database' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
