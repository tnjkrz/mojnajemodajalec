const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const pool = require("../dbconn");

/* ---------------- JWT admin guard (no cookies) ---------------- */

function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(403).json({ error: "forbidden" });
    const payload = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET || "dev_admin_secret_change"
    );
    if (!payload || payload.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }
    req.admin = { admin_user_id: payload.admin_user_id, username: payload.username };
    next();
  } catch (e) {
    return res.status(403).json({ error: "forbidden" });
  }
}

async function withTx(run) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await run(conn);
    await conn.commit();
    conn.release();
    return result;
  } catch (e) {
    try { await conn.rollback(); } catch {}
    conn.release();
    throw e;
  }
}

/* ---------------- list reports ---------------- */

// GET /api/admin/reports
router.get("/reports", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.report_id, r.reporter_user_id, r.target_type, r.target_id,
        r.reason, r.status, r.created_at, r.resolved_by_user_id,

        ru.username AS reporter_username, ru.is_banned AS reporter_is_banned,

        p.property_id, p.street, p.house_number, p.city, p.postal_code,
        l.landlord_id, l.first_name, l.last_name,
        rv.review_id, rv.property_id AS review_property_id

      FROM Report r
      LEFT JOIN User ru ON ru.user_id = r.reporter_user_id
      LEFT JOIN Property p ON (r.target_type='property' AND r.target_id=p.property_id)
      LEFT JOIN Landlord l ON (r.target_type='landlord' AND r.target_id=l.landlord_id)
      LEFT JOIN Review  rv ON (r.target_type='review'   AND r.target_id=rv.review_id)
      ORDER BY r.created_at DESC
      LIMIT 500
    `);

    const normalized = rows.map(r => ({
      ...r,
      property_id: r.target_type === "review" ? r.review_property_id : r.property_id,
      target_label:
        r.target_type === "property"
          ? [r.street, r.house_number, r.city].filter(Boolean).join(" ")
          : r.target_type === "landlord"
          ? [r.first_name, r.last_name].filter(Boolean).join(" ")
          : `Ocena #${r.target_id}`,
    }));

    res.json({ reports: normalized });
  } catch (e) {
    console.error("admin list reports error:", e);
    res.status(500).json({ error: "db_error" });
  }
});

/* ---------------- update report status ---------------- */

// PUT /api/admin/reports/:id   { status: 'resolved'|'dismissed'|'pending' }
router.put("/reports/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!id || !["resolved", "dismissed", "pending"].includes(status)) {
    return res.status(400).json({ error: "bad_request" });
  }
  try {
    await pool.query("UPDATE Report SET status = ? WHERE report_id = ?", [status, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("admin set status error:", e);
    res.status(500).json({ error: "db_error" });
  }
});

/* ---------------- ban / unban ---------------- */

// POST /api/admin/ban  { user_id, banned: true|false }
router.post("/ban", requireAdmin, async (req, res) => {
  const { user_id, banned } = req.body || {};
  const id = Number(user_id);
  if (!id || typeof banned !== "boolean") return res.status(400).json({ error: "bad_request" });
  try {
    await pool.query("UPDATE User SET is_banned = ? WHERE user_id = ?", [banned ? 1 : 0, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("admin ban error:", e);
    res.status(500).json({ error: "db_error" });
  }
});

// GET /api/admin/banned  -> list of banned users
router.get("/banned", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, username, role, is_banned FROM User WHERE is_banned = 1 ORDER BY user_id DESC LIMIT 500"
    );
    res.json({ users: rows || [] });
  } catch (e) {
    console.error("admin banned list error:", e);
    res.status(500).json({ error: "db_error" });
  }
});

/* ---------------- cascaded deletes (keep Report rows) ---------------- */

async function deletePropertyCascade(conn, property_id) {
  const [[p]] = await conn.query(
    "SELECT property_id, landlord_id FROM Property WHERE property_id = ? FOR UPDATE",
    [property_id]
  );
  if (!p) return { ok: false, reason: "not_found" };
  const landlord_id = p.landlord_id;

  await conn.query("DELETE FROM Review WHERE property_id = ?", [property_id]);
  await conn.query("DELETE FROM Property WHERE property_id = ?", [property_id]);

  const [[c]] = await conn.query(
    "SELECT COUNT(*) AS cnt FROM Property WHERE landlord_id = ?",
    [landlord_id]
  );
  if (Number(c.cnt) === 0) {
    await conn.query("DELETE FROM Landlord WHERE landlord_id = ?", [landlord_id]);
    return { ok: true, landlordDeleted: true };
  }
  return { ok: true, landlordDeleted: false };
}

async function deleteLandlordCascade(conn, landlord_id) {
  const [[l]] = await conn.query(
    "SELECT landlord_id FROM Landlord WHERE landlord_id = ? FOR UPDATE",
    [landlord_id]
  );
  if (!l) return { ok: false, reason: "not_found" };

  await conn.query(
    "DELETE FROM Review WHERE property_id IN (SELECT property_id FROM Property WHERE landlord_id = ?)",
    [landlord_id]
  );
  await conn.query("DELETE FROM Property WHERE landlord_id = ?", [landlord_id]);
  await conn.query("DELETE FROM Landlord WHERE landlord_id = ?", [landlord_id]);

  return { ok: true };
}

async function deleteReviewCascade(conn, review_id) {
  const [[r]] = await conn.query(
    `SELECT r.review_id, r.property_id, p.landlord_id
       FROM Review r
       JOIN Property p ON p.property_id = r.property_id
      WHERE r.review_id = ? FOR UPDATE`,
    [review_id]
  );
  if (!r) return { ok: false, reason: "not_found" };

  const property_id = r.property_id;
  const landlord_id = r.landlord_id;

  await conn.query("DELETE FROM Review WHERE review_id = ?", [review_id]);

  const [[rc]] = await conn.query("SELECT COUNT(*) AS cnt FROM Review WHERE property_id = ?", [property_id]);
  if (Number(rc.cnt) === 0) {
    await conn.query("DELETE FROM Property WHERE property_id = ?", [property_id]);

    const [[pc]] = await conn.query("SELECT COUNT(*) AS cnt FROM Property WHERE landlord_id = ?", [landlord_id]);
    if (Number(pc.cnt) === 0) {
      await conn.query("DELETE FROM Landlord WHERE landlord_id = ?", [landlord_id]);
      return { ok: true, propertyDeleted: true, landlordDeleted: true };
    }
    return { ok: true, propertyDeleted: true, landlordDeleted: false };
  }
  return { ok: true, propertyDeleted: false, landlordDeleted: false };
}

// DELETE /api/admin/delete/:type/:id
router.delete("/delete/:type/:id", requireAdmin, async (req, res) => {
  const type = String(req.params.type || "").toLowerCase();
  const id = Number(req.params.id);
  if (!["property", "landlord", "review"].includes(type) || !id)
    return res.status(400).json({ error: "bad_request" });

  try {
    const result = await withTx(async (conn) => {
      if (type === "property") return deletePropertyCascade(conn, id);
      if (type === "landlord") return deleteLandlordCascade(conn, id);
      return deleteReviewCascade(conn, id);
    });
    if (!result.ok && result.reason === "not_found")
      return res.status(404).json({ error: "not_found" });
    res.json(result);
  } catch (e) {
    console.error("admin delete error:", e);
    res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;
