const express = require("express");
const router = express.Router();
const conn = require("../dbconn");

router.post("/", async (req, res) => {
  const b = req.body || {};
  const uid = req.user_id || null;
  if (!b.property_id) return res.status(400).json({ error: "missing_property" });
  try {
    const [dup] = await conn.query(
      "SELECT 1 FROM Review WHERE user_id = ? AND property_id = ? LIMIT 1",
      [uid, b.property_id]
    );
    if (dup.length) return res.status(409).json({ error: "already_reviewed" });

    await conn.query(
      `INSERT INTO Review
       (user_id, property_id, comment, created_at,
        communication_score, repairs_score, moving_score, health_safety_score, privacy_score)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        uid, b.property_id, b.comment || null, new Date(),
        b.communication_score|0, b.repairs_score|0, b.moving_score|0,
        b.health_safety_score|0, b.privacy_score|0
      ]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e); res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;
