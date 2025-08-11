const express = require("express");
const router = express.Router();
const conn = require("../dbconn");

// create a new report
router.post("/", async (req, res) => {
  try {
    const b = req.body || {};
    const target_type = String(b.target_type || "").toLowerCase();
    const target_id   = Number(b.target_id);
    const reason      = String(b.reason || "").trim();
    const other_text  = b.other_text != null ? String(b.other_text).trim() : "";

    if (!["property","landlord","review"].includes(target_type)) {
      return res.status(400).json({ error: "bad_target_type" });
    }
    if (!target_id)   return res.status(400).json({ error: "bad_target_id" });
    if (!reason)      return res.status(400).json({ error: "bad_reason" });

    const reporter_user_id = req.user_id || null;
    if (!reporter_user_id) return res.status(401).json({ error: "no_user_in_session" });

    const finalReason = (reason === "Drugo" && other_text)
      ? `${reason}: ${other_text}` : reason;

    // debugging 
    console.log("REPORT NEW", {
      reporter_user_id,
      target_type,
      target_id,
      finalReason,
    });

    // insert the report into the database
    const sql = `
      INSERT INTO Report
        (reporter_user_id, resolved_by_user_id, target_type, target_id, reason, created_at, status)
      VALUES
        (?, NULL, ?, ?, ?, NOW(), 'pending')
    `;
    await conn.query(sql, [reporter_user_id, target_type, target_id, finalReason]);

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error("report insert error:", e); // debugging, report errors
    return res.status(500).json({ error: "db_error" });
  }
});

// get all reports
router.get("/", async (req, res) => {
  try {
    const [rows] = await conn.query(`
      SELECT r.report_id, r.target_type, r.target_id, r.reason, r.created_at,
             u.username,
             CASE 
               WHEN r.target_type = 'review' THEN rev.comment
               WHEN r.target_type = 'property' THEN CONCAT(p.street, ' ', p.house_number, ', ', p.city)
               WHEN r.target_type = 'landlord' THEN CONCAT(l.first_name, ' ', l.last_name)
             END AS target_label
      FROM Report r
      LEFT JOIN User u ON r.user_id = u.user_id
      LEFT JOIN Review rev ON r.target_type = 'review' AND rev.review_id = r.target_id
      LEFT JOIN Property p ON r.target_type = 'property' AND p.property_id = r.target_id
      LEFT JOIN Landlord l ON r.target_type = 'landlord' AND l.landlord_id = r.target_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db_error" });
  }
});


module.exports = router;
