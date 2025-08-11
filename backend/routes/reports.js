const express = require("express");
const router = express.Router();
const conn = require("../dbconn");

// POST /api/reports
// body: { target_type: 'property'|'landlord'|'review', target_id: number, reason: string, other_text?: string }
router.post("/", async (req, res) => {
  try {
    const b = req.body || {};

    const target_type = String(b.target_type || "").toLowerCase();
    const target_id = Number(b.target_id);
    const reason = String(b.reason || "").trim();
    const other_text = b.other_text != null ? String(b.other_text).trim() : "";

    if (!["property", "landlord", "review"].includes(target_type)) {
      return res.status(400).json({ error: "bad_target_type" });
    }
    if (!target_id) {
      return res.status(400).json({ error: "bad_target_id" });
    }
    if (!reason) {
      return res.status(400).json({ error: "bad_reason" });
    }

    // session middleware sets req.user_id (anonymous user if needed)
    const reporter_user_id = req.user_id || null;

    // Some schemas require NOT NULL, so fail clearly if user_id missing
    if (!reporter_user_id) {
      return res.status(401).json({ error: "no_user_in_session" });
    }

    const finalReason =
      reason === "Drugo" && other_text ? `${reason}: ${other_text}` : reason;

    await conn.query(
      `
      INSERT INTO Report
        (reporter_user_id, target_type, target_id, reason, created_at, status)
      VALUES
        (?, ?, ?, ?, NOW(), 'pending')
      `,
      [reporter_user_id, target_type, target_id, finalReason]
    );

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error("report insert error:", e);
    return res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;
