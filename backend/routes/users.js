const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // GET all users
  router.get('/', (req, res) => {
    pool.query('SELECT * FROM User', (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    });
  });

  return router;
};
