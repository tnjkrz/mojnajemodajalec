const express = require('express');
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8210;

// DB pool (your server DB)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'studenti',
  password: process.env.DB_PASS || 'S039C8R7',
  database: process.env.DB_DATABASE || 'SISIII2025_89221132',
  port: 3306
});

app.use(express.json());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Users (returns everything from table User)
app.get('/api/users', (_req, res) => {
  pool.query('SELECT * FROM User', (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'db_error' });
    }
    res.json(rows);
  });
});

// Serve React build (no path pattern → no path-to-regexp issues)
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));
app.use((req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
