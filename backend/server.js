// ARRABIS BLACK MARKET SERVER
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const initSqlJs = require('sql.js');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

let db;
let SQL;

// DATABASE
async function initDB() {
  SQL = await initSqlJs();
  const dbPath = './arrakis.db';
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('[DB] Loaded from file');
  } else {
    db = new SQL.Database();
    console.log('[DB] New database created');
  }
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync('./arrakis.db', Buffer.from(data));
}

function runSQL(sql, params) {
  if (params) db.run(sql, params);
  else db.run(sql);
  saveDB();
}

function queryAll(sql, params) {
  let stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  let results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql, params) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function getLastId() {
  const result = queryOne('SELECT max(id) as id FROM users');
  return result ? result.id : 1;
}

// TABLES
function createTables() {
  runSQL(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      solaris REAL DEFAULT 5.00 NOT NULL,
      role TEXT DEFAULT 'user' NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);
  
  runSQL(`
    CREATE TABLE IF NOT EXISTS market_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      rarity TEXT NOT NULL,
      description TEXT,
      image TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  runSQL(`
    CREATE TABLE IF NOT EXISTS user_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES market_items(id) ON DELETE CASCADE,
      UNIQUE(user_id, item_id)
    )
  `);
  
  runSQL(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    )
  `);
  
  runSQL(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      sender_item_id INTEGER NOT NULL,
      receiver_item_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_item_id) REFERENCES market_items(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_item_id) REFERENCES market_items(id) ON DELETE CASCADE
    )
  `);
  
  // Seed items
  const itemCount = queryOne('SELECT COUNT(*) as count FROM market_items');
  if (!itemCount || itemCount.count === 0) {
    const items = [
      ['Sandworm Juvenil', 'CRIATURA', 'legendario', 'Un joven Shai-Hulud.', 'Captura de pantalla 2026-04-16 223231.png'],
      ['Sardaukar', 'CRIATURA', 'legendario', 'Soldado del Emperador.', 'Captura de pantalla 2026-04-16 223251.png'],
      ['Melange', 'RECURSO', 'legendario', 'La Especia.', 'Captura de pantalla 2026-04-16 223304.png'],
      ['Harkonnen Brutal', 'CRIATURA', 'epico', 'Fuerte y despiadado.', 'Captura de pantalla 2026-04-16 223329.png'],
      ['Harén Fremen', 'CRIATURA', 'epico', 'Guerreras del desierto.', 'Captura de pantalla 2026-04-16 223535.png'],
      ['Maestre Harkonnen', 'CRIATURA', 'epico', 'Intelectuales brutales.', 'Captura de pantalla 2026-04-16 223539.png'],
      ['Residuo de Filtro', 'RECURSO', 'raro', 'Agua de stillsuit.', 'Captura de pantalla 2026-04-16 223605.png'],
      ['Bolsas', 'RECURSO', 'comun', 'Bolsas de cuero.', 'Captura de pantalla 2026-04-16 224358.png'],
      ['Tierra', 'RECURSO', 'comun', 'Muestra de arena.', 'Captura de pantalla 2026-04-16 224407.png']
    ];
    for (const item of items) {
      runSQL('INSERT INTO market_items (name, type, rarity, description, image) VALUES (?, ?, ?, ?, ?)', item);
    }
  }
  console.log('[OK] Tablas inicializadas');
}

// MIDDLEWARE
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'arrakis_key_2026';

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalido' });
    req.user = user;
    next();
  });
}

// ROUTES
app.get('/', (req, res) => res.json({ message: 'Arrakis Black Market API', version: '1.0.0' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    const existing = queryAll('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Usuario o correo ya existe' });
    }
    const hash = await bcrypt.hash(password, 10);
    runSQL('INSERT INTO users (username, email, password_hash, solaris) VALUES (?, ?, ?, ?)', [username, email, hash, 5.00]);
    const userId = queryOne('SELECT max(id) as id FROM users').id;
    const token = jwt.sign({ id: userId, username, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Usuario creado', token, user: { id: userId, username, email, solaris: 5.00 } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = queryOne('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    runSQL('UPDATE users SET last_login = datetime("now") WHERE id = ?', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login exitoso', token, user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url, solaris: user.solaris } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = queryOne('SELECT id, username, email, avatar_url, solaris, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

app.get('/api/items', (req, res) => res.json(queryAll('SELECT * FROM market_items ORDER BY rarity DESC, name ASC')));

app.post('/api/market/spin', auth, (req, res) => {
  const user = queryOne('SELECT solaris FROM users WHERE id = ?', [req.user.id]);
  if (!user || user.solaris < 1) {
    return res.status(400).json({ error: 'No tienes suficientes Solaris' });
  }
  const items = queryAll('SELECT * FROM market_items');
  const roll = Math.random();
  let rarity = roll < 0.02 ? 'legendario' : roll < 0.10 ? 'epico' : roll < 0.35 ? 'raro' : 'comun';
  const filtered = items.filter(i => i.rarity === rarity);
  const item = filtered[Math.floor(Math.random() * filtered.length)] || items[0];
  runSQL('UPDATE users SET solaris = solaris - 1 WHERE id = ?', [req.user.id]);
  try {
    runSQL('INSERT INTO user_inventory (user_id, item_id) VALUES (?, ?)', [req.user.id, item.id]);
  } catch (e) {}
  res.json({ message: 'Item obtenido', item, remaining_solaris: user.solaris - 1 });
});

app.get('/api/inventory', auth, (req, res) => {
  const items = queryAll(`
    SELECT mi.*, ui.obtained_at FROM user_inventory ui
    JOIN market_items mi ON ui.item_id = mi.id
    WHERE ui.user_id = ? ORDER BY ui.obtained_at DESC
  `, [req.user.id]);
  res.json(items);
});

app.get('/api/friends', auth, (req, res) => {
  const friends = queryAll(`
    SELECT u.id, u.username, u.avatar_url, u.solaris
    FROM friendships f JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ? AND f.status = 'accepted'
  `, [req.user.id]);
  res.json(friends);
});

app.post('/api/friends/request', auth, (req, res) => {
  const { username } = req.body;
  const friend = queryOne('SELECT id FROM users WHERE username = ?', [username]);
  if (!friend) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (friend.id === req.user.id) return res.status(400).json({ error: 'No puedes agregarte a ti mismo' });
  const existing = queryAll('SELECT id FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [req.user.id, friend.id, friend.id, req.user.id]);
  if (existing.length > 0) return res.status(400).json({ error: 'Ya existe una solicitud' });
  runSQL('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)', [req.user.id, friend.id, 'pending']);
  res.json({ message: 'Solicitud enviada' });
});

// Trades - Get pending trades
app.get('/api/trades', auth, (req, res) => {
  const trades = queryAll(`
    SELECT t.*, 
           u1.username as sender_username,
           u2.username as receiver_username,
           mi1.name as sender_item_name,
           mi1.image as sender_item_image,
           mi1.rarity as sender_item_rarity,
           mi2.name as receiver_item_name,
           mi2.image as receiver_item_image,
           mi2.rarity as receiver_item_rarity
    FROM trades t
    JOIN users u1 ON t.sender_id = u1.id
    JOIN users u2 ON t.receiver_id = u2.id
    JOIN market_items mi1 ON t.sender_item_id = mi1.id
    LEFT JOIN market_items mi2 ON t.receiver_item_id = mi2.id
    WHERE t.sender_id = ? OR t.receiver_id = ?
    ORDER BY t.created_at DESC
  `, [req.user.id, req.user.id]);
  res.json(trades);
});

// Create a trade offer
app.post('/api/trades', auth, (req, res) => {
  const { friend_id, item_id } = req.body;
  if (!friend_id || !item_id) return res.status(400).json({ error: 'Datos incompletos' });
  
  // Verify they're friends
  const friendship = queryOne(`
    SELECT id FROM friendships 
    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    AND status = 'accepted'
  `, [req.user.id, friend_id, friend_id, req.user.id]);
  
  if (!friendship) return res.status(400).json({ error: 'Deben ser amigos para hacer un trato' });
  
  // Verify user owns the item
  const userItem = queryOne('SELECT id FROM user_inventory WHERE user_id = ? AND item_id = ?', [req.user.id, item_id]);
  if (!userItem) return res.status(400).json({ error: 'No tienes ese item' });
  
  runSQL('INSERT INTO trades (sender_id, receiver_id, sender_item_id) VALUES (?, ?, ?)', [req.user.id, friend_id, item_id]);
  res.json({ message: 'Trato enviado' });
});

// Accept trade
app.post('/api/trades/:id/accept', auth, (req, res) => {
  const trade = queryOne('SELECT * FROM trades WHERE id = ? AND receiver_id = ? AND status = "pending"', [req.params.id, req.user.id]);
  if (!trade) return res.status(404).json({ error: 'Trato no encontrado' });
  
  runSQL('UPDATE trades SET status = "accepted", updated_at = datetime("now") WHERE id = ?', [trade.id]);
  res.json({ message: 'Trato aceptado' });
});

// Decline trade
app.post('/api/trades/:id/decline', auth, (req, res) => {
  const trade = queryOne('SELECT * FROM trades WHERE id = ? AND receiver_id = ? AND status = "pending"', [req.params.id, req.user.id]);
  if (!trade) return res.status(404).json({ error: 'Trato no encontrado' });
  
  runSQL('UPDATE trades SET status = "declined", updated_at = datetime("now") WHERE id = ?', [trade.id]);
  res.json({ message: 'Trato rechazado' });
});

// START
async function start() {
  await initDB();
  createTables();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('API running on port ' + PORT);
  });
}

start();