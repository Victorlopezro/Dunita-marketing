require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg'); // Importar pg para PostgreSQL

const app = express();
const PORT = process.env.PORT || 3001;

let pool; // Pool de conexiones para PostgreSQL

// DATABASE
async function initDB() {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Necesario para Neon en algunos entornos de Railway
      }
    });
    await pool.connect();
    console.log('[DB] Conectado a PostgreSQL');
    await createTables(); // Asegurarse de que las tablas existan
  } catch (err) {
    console.error('[DB] Error al conectar a PostgreSQL', err);
    process.exit(1); // Salir si no se puede conectar a la DB
  }
}

async function runSQL(sql, params = []) {
  const client = await pool.connect();
  try {
    await client.query(sql, params);
  } finally {
    client.release();
  }
}

async function queryAll(sql, params = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    client.release();
  }
}

async function queryOne(sql, params = []) {
  const results = await queryAll(sql, params);
  return results[0] || null;
}

// TABLES
async function createTables() {
  // Las sentencias SQL deben ser compatibles con PostgreSQL
  await runSQL(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      solaris NUMERIC(10,2) DEFAULT 5.00 NOT NULL,
      role VARCHAR(20) DEFAULT 'user' NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP WITH TIME ZONE
    )
  `);
  
  // Trigger para updated_at en users
  await runSQL(`
    CREATE OR REPLACE FUNCTION update_users_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await runSQL(`
    DROP TRIGGER IF EXISTS set_users_updated_at ON users;
    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_timestamp();
  `);

  await runSQL(`
    CREATE TABLE IF NOT EXISTS market_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      rarity VARCHAR(50) NOT NULL,
      description TEXT,
      image VARCHAR(500) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await runSQL(`
    CREATE TABLE IF NOT EXISTS user_inventory (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      obtained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES market_items(id) ON DELETE CASCADE,
      UNIQUE(user_id, item_id)
    )
  `);
  
  await runSQL(`
    CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    )
  `);

  // Trigger para updated_at en friendships
  await runSQL(`
    CREATE OR REPLACE FUNCTION update_friendships_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await runSQL(`
    DROP TRIGGER IF EXISTS set_friendships_updated_at ON friendships;
    CREATE TRIGGER set_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION update_friendships_timestamp();
  `);
  
  await runSQL(`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      sender_item_id INTEGER NOT NULL,
      receiver_item_id INTEGER,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_item_id) REFERENCES market_items(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_item_id) REFERENCES market_items(id) ON DELETE CASCADE
    )
  `);

  // Trigger para updated_at en trades
  await runSQL(`
    CREATE OR REPLACE FUNCTION update_trades_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await runSQL(`
    DROP TRIGGER IF EXISTS set_trades_updated_at ON trades;
    CREATE TRIGGER set_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_trades_timestamp();
  `);
  
  // Seed items (solo si la tabla está vacía)
  const itemCount = await queryOne('SELECT COUNT(*) as count FROM market_items');
  if (!itemCount || itemCount.count === '0') { // PostgreSQL devuelve count como string
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
      await runSQL('INSERT INTO market_items (name, type, rarity, description, image) VALUES ($1, $2, $3, $4, $5)', item);
    }
  }
  console.log('[OK] Tablas inicializadas y datos semilla cargados (si aplica)');
}

// MIDDLEWARE
// Configuración de CORS para permitir el origen del frontend de Vercel
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Usar variable de entorno o permitir todo en desarrollo
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET; // JWT_SECRET DEBE ser una variable de entorno
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET no está definido en las variables de entorno.');
  process.exit(1);
}

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
    const existing = await queryAll('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Usuario o correo ya existe' });
    }
    const hash = await bcrypt.hash(password, 10);
    await runSQL('INSERT INTO users (username, email, password_hash, solaris) VALUES ($1, $2, $3, $4)', [username, email, hash, 5.00]);
    const userId = (await queryOne('SELECT id FROM users WHERE username = $1', [username])).id; // Obtener el ID del usuario recién creado
    const token = jwt.sign({ id: userId, username, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Usuario creado', token, user: { id: userId, username, email, solaris: 5.00 } });
  } catch (e) {
    console.error('Error en registro:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE username = $1 OR email = $2', [username, username]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    await runSQL('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login exitoso', token, user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url, solaris: user.solaris } });
  } catch (e) {
    console.error('Error en login:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, username, email, avatar_url, solaris, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (e) {
    console.error('Error en /api/auth/me:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const items = await queryAll('SELECT * FROM market_items ORDER BY rarity DESC, name ASC');
    res.json(items);
  } catch (e) {
    console.error('Error en /api/items:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/market/spin', auth, async (req, res) => {
  try {
    const user = await queryOne('SELECT solaris FROM users WHERE id = $1', [req.user.id]);
    if (!user || user.solaris < 1) {
      return res.status(400).json({ error: 'No tienes suficientes Solaris' });
    }
    const items = await queryAll('SELECT * FROM market_items');
    const roll = Math.random();
    let rarity = roll < 0.02 ? 'legendario' : roll < 0.10 ? 'epico' : roll < 0.35 ? 'raro' : 'comun';
    const filtered = items.filter(i => i.rarity === rarity);
    const item = filtered[Math.floor(Math.random() * filtered.length)] || items[0];
    await runSQL('UPDATE users SET solaris = solaris - 1 WHERE id = $1', [req.user.id]);
    try {
      await runSQL('INSERT INTO user_inventory (user_id, item_id) VALUES ($1, $2)', [req.user.id, item.id]);
    } catch (e) {
      // Si el item ya está en el inventario, ignorar el error de UNIQUE constraint
      if (!e.message.includes('duplicate key value violates unique constraint')) {
        throw e;
      }
    }
    res.json({ message: 'Item obtenido', item, remaining_solaris: user.solaris - 1 });
  } catch (e) {
    console.error('Error en /api/market/spin:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/inventory', auth, async (req, res) => {
  try {
    const items = await queryAll(`
      SELECT mi.*, ui.obtained_at FROM user_inventory ui
      JOIN market_items mi ON ui.item_id = mi.id
      WHERE ui.user_id = $1 ORDER BY ui.obtained_at DESC
    `, [req.user.id]);
    res.json(items);
  } catch (e) {
    console.error('Error en /api/inventory:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/friends', auth, async (req, res) => {
  try {
    const friends = await queryAll(`
      SELECT u.id, u.username, u.avatar_url, u.solaris
      FROM friendships f JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1 AND f.status = 'accepted'
    `, [req.user.id]);
    res.json(friends);
  } catch (e) {
    console.error('Error en /api/friends:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/friends/request', auth, async (req, res) => {
  try {
    const { username } = req.body;
    const friend = await queryOne('SELECT id FROM users WHERE username = $1', [username]);
    if (!friend) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (friend.id === req.user.id) return res.status(400).json({ error: 'No puedes agregarte a ti mismo' });
    const existing = await queryAll('SELECT id FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $3 AND friend_id = $4)', [req.user.id, friend.id, friend.id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ error: 'Ya existe una solicitud' });
    await runSQL('INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)', [req.user.id, friend.id, 'pending']);
    res.json({ message: 'Solicitud enviada' });
  } catch (e) {
    console.error('Error en /api/friends/request:', e);
    res.status(500).json({ error: e.message });
  }
});

// Trades - Get pending trades
app.get('/api/trades', auth, async (req, res) => {
  try {
    const trades = await queryAll(`
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
      WHERE t.sender_id = $1 OR t.receiver_id = $2
      ORDER BY t.created_at DESC
    `, [req.user.id, req.user.id]);
    res.json(trades);
  } catch (e) {
    console.error('Error en /api/trades:', e);
    res.status(500).json({ error: e.message });
  }
});

// Create a trade offer
app.post('/api/trades', auth, async (req, res) => {
  try {
    const { friend_id, item_id } = req.body;
    if (!friend_id || !item_id) return res.status(400).json({ error: 'Datos incompletos' });
    
    // Verify they're friends
    const friendship = await queryOne(`
      SELECT id FROM friendships 
      WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $3 AND friend_id = $4)
      AND status = 'accepted'
    `, [req.user.id, friend_id, friend_id, req.user.id]);
    
    if (!friendship) return res.status(400).json({ error: 'Deben ser amigos para hacer un trato' });
    
    // Verify user owns the item
    const userItem = await queryOne('SELECT id FROM user_inventory WHERE user_id = $1 AND item_id = $2', [req.user.id, item_id]);
    if (!userItem) return res.status(400).json({ error: 'No tienes ese item' });
    
    await runSQL('INSERT INTO trades (sender_id, receiver_id, sender_item_id) VALUES ($1, $2, $3)', [req.user.id, friend_id, item_id]);
    res.json({ message: 'Trato enviado' });
  } catch (e) {
    console.error('Error en /api/trades:', e);
    res.status(500).json({ error: e.message });
  }
});

// Accept trade
app.post('/api/trades/:id/accept', auth, async (req, res) => {
  try {
    const trade = await queryOne('SELECT * FROM trades WHERE id = $1 AND receiver_id = $2 AND status = \'pending\'', [req.params.id, req.user.id]);
    if (!trade) return res.status(404).json({ error: 'Trato no encontrado' });
    
    await runSQL('UPDATE trades SET status = \'accepted\', updated_at = NOW() WHERE id = $1', [trade.id]);
    res.json({ message: 'Trato aceptado' });
  } catch (e) {
    console.error('Error en /api/trades/:id/accept:', e);
    res.status(500).json({ error: e.message });
  }
});

// Decline trade
app.post('/api/trades/:id/decline', auth, async (req, res) => {
  try {
    const trade = await queryOne('SELECT * FROM trades WHERE id = $1 AND receiver_id = $2 AND status = \'pending\'', [req.params.id, req.user.id]);
    if (!trade) return res.status(404).json({ error: 'Trato no encontrado' });
    
    await runSQL('UPDATE trades SET status = \'declined\', updated_at = NOW() WHERE id = $1', [trade.id]);
    res.json({ message: 'Trato rechazado' });
  } catch (e) {
    console.error('Error en /api/trades/:id/decline:', e);
    res.status(500).json({ error: e.message });
  }
});

// START
async function start() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('API running on port ' + PORT);
  });
}

start();