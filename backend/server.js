require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Dunita Backend API' });
});

// Subscribe endpoint
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query(
      'INSERT INTO subscribers (email, created_at) VALUES ($1, NOW()) ON CONFLICT (email) DO NOTHING RETURNING *',
      [email]
    );

    if (result.rows.length > 0) {
      res.json({ message: 'Subscribed successfully' });
    } else {
      res.json({ message: 'Already subscribed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscribers (for admin)
app.get('/api/subscribers', async (req, res) => {
  try {
    const result = await pool.query('SELECT email, created_at FROM subscribers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});