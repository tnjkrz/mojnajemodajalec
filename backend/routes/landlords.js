const express = require("express");
const router = express.Router();
const conn = require("../dbconn");

// create landlord, but reuse existing if same first+last already exists
router.post("/", async (req, res) => {
  const b = req.body || {};
  const first = String(b.first_name || "").trim();
  const last  = String(b.last_name  || "").trim();

  if (!first || !last) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    // try to reuse existing 
    const [found] = await conn.query(
      `SELECT landlord_id
         FROM Landlord
        WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(last_name))  = LOWER(TRIM(?))
        LIMIT 1`,
      [first, last]
    );

    if (found.length) {
      // reuse existing landlord
      return res.status(200).json({ landlord_id: found[0].landlord_id, reused: true });
    }

    // else, create new
    const [r] = await conn.query(
      `INSERT INTO Landlord (first_name, last_name, user_id)
       VALUES (?,?,?)`,
      [first, last, req.user_id || null]
    );

    return res.status(201).json({ landlord_id: r.insertId, reused: false });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "db_error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "bad_id" });

  try {
    const [[landlord]] = await conn.query(
      "SELECT * FROM Landlord WHERE landlord_id = ?",
      [id]
    );
    if (!landlord) return res.status(404).json({ error: "not_found" });

    const [properties] = await conn.query(
      `SELECT property_id, city, street, house_number, postal_code
         FROM Property
        WHERE landlord_id = ?
        ORDER BY property_id DESC`,
      [id]
    );

    res.json({ landlord, properties });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;
