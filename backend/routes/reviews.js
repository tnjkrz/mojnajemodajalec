const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // Get all reviews
  router.get('/', (req, res) => {
    pool.query('SELECT * FROM Review', (err, results) => {
      if (err) {
        console.error('Error fetching reviews:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    });
  });

  return router;
};
