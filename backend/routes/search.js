const express = require("express");
const router = express.Router();
const conn = require("../dbconn");

// GET /api/search?q=...
// Returns properties with landlord info where EITHER landlord name OR address matches.
// Shape: { properties: [{ property_id, street, house_number, city, postal_code, landlord_id, first_name, last_name }] }
router.get("/", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q || q.length < 2) {
    return res.json({ properties: [], landlords: [] });
  }

  // Use %q% for LIKE
  const like = `%${q}%`;

  try {
    // 1) Properties joined with landlords (primary list you’ll render)
    const [props] = await conn.query(
      `
      SELECT
        p.property_id, p.street, p.house_number, p.city, p.postal_code,
        p.landlord_id, l.first_name, l.last_name
      FROM Property p
      JOIN Landlord l ON l.landlord_id = p.landlord_id
      WHERE
        -- match landlord full name or parts
        CONCAT(l.first_name, ' ', l.last_name) LIKE ?
        OR l.first_name LIKE ?
        OR l.last_name  LIKE ?
        -- OR match address parts
        OR p.street LIKE ?
        OR p.city   LIKE ?
        OR CONCAT(p.street, ' ', p.house_number) LIKE ?
        OR CONCAT(p.street, ' ', p.house_number, ', ', p.city) LIKE ?
      ORDER BY
        -- show landlord-name matches a bit earlier, then newest properties
        (CONCAT(l.first_name, ' ', l.last_name) LIKE ?) ASC,
        p.property_id DESC
      LIMIT 50
      `,
      [like, like, like, like, like, like, like, like]
    );

    // 2) (Optional) landlords list for future use (if you want to show a “see all properties by …”)
    const [lands] = await conn.query(
      `
      SELECT landlord_id, first_name, last_name
      FROM Landlord
      WHERE CONCAT(first_name, ' ', last_name) LIKE ?
         OR first_name LIKE ?
         OR last_name  LIKE ?
      ORDER BY landlord_id DESC
      LIMIT 20
      `,
      [like, like, like]
    );

    res.json({ properties: props || [], landlords: lands || [] });
  } catch (e) {
    console.error("search error:", e);
    res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;
