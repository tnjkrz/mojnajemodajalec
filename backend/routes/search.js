const express = require("express");
const router = express.Router();
const conn = require("../dbconn");

router.get("/", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ properties: [], landlords: [] });
  const like = `%${q}%`;
  try {
    const [props] = await conn.query(
      `SELECT property_id, city, street, house_number, postal_code, landlord_id
       FROM Property
       WHERE CONCAT(street,' ',house_number,' ',city) LIKE ?
          OR street LIKE ? OR city LIKE ?
       ORDER BY property_id DESC LIMIT 10`, [like, like, like]
    );
    const [lands] = await conn.query(
      `SELECT landlord_id, first_name, last_name
       FROM Landlord
       WHERE CONCAT(first_name,' ',last_name) LIKE ?
       ORDER BY landlord_id DESC LIMIT 10`, [like]
    );
    res.json({ properties: props, landlords: lands });
  } catch (e) {
    console.error(e); res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;
