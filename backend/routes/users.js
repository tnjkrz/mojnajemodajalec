const express = require("express");
const router = express.Router();
const conn = require("../dbconn"); 

// GET all users
router.get("/", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM User");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
