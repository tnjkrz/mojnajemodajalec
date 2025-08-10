const express = require("express");
const router = express.Router();
const conn = require("../dbconn");

// Create property, but reuse existing if landlord+address match
router.post("/", async (req, res) => {
  const b = req.body || {};
  const landlord_id = Number(b.landlord_id) || null;
  const city        = String(b.city || "").trim();
  const street      = String(b.street || "").trim();
  const house_number= String(b.house_number || "").trim();
  const postal_code = (b.postal_code === null || b.postal_code === undefined)
    ? "" : String(b.postal_code).trim();

  if (!landlord_id || !city || !street || !house_number) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    // Try to reuse existing (case-insensitive, space-normalized)
    const [found] = await conn.query(
      `SELECT property_id
         FROM Property
        WHERE landlord_id = ?
          AND LOWER(TRIM(city))         = LOWER(TRIM(?))
          AND LOWER(TRIM(street))       = LOWER(TRIM(?))
          AND LOWER(TRIM(house_number)) = LOWER(TRIM(?))
          AND (postal_code IS NULL AND ? = '' OR TRIM(postal_code) = TRIM(?))
        LIMIT 1`,
      [landlord_id, city, street, house_number, postal_code, postal_code]
    );

    if (found.length) {
      return res.status(200).json({ property_id: found[0].property_id, reused: true });
    }

    const [r] = await conn.query(
      `INSERT INTO Property (landlord_id, user_id, city, street, postal_code, house_number)
       VALUES (?,?,?,?,?,?)`,
      [landlord_id, req.user_id || null, city, street, postal_code || null, house_number]
    );

    return res.status(201).json({ property_id: r.insertId, reused: false });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db_error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "bad_id" });

  try {
    const [[property]] = await conn.query(
      "SELECT * FROM Property WHERE property_id = ?",
      [id]
    );
    if (!property) return res.status(404).json({ error: "not_found" });

    const [[landlord]] = await conn.query(
      "SELECT landlord_id, first_name, last_name FROM Landlord WHERE landlord_id = ?",
      [property.landlord_id]
    );

    const [reviews] = await conn.query(
      `SELECT review_id, user_id, comment, created_at,
              communication_score, repairs_score, moving_score, health_safety_score, privacy_score
         FROM Review
        WHERE property_id = ?
        ORDER BY created_at DESC`,
      [id]
    );

    res.json({ property, landlord, reviews });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;
