const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const conn = require("../dbconn");

// GET /api/admin/auth/me  -> check token in Authorization header
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.json({ is_admin: false });

    const payload = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET || "dev_admin_secret_change"
    );
    if (payload?.role !== "admin") return res.json({ is_admin: false });

    return res.json({ is_admin: true, username: payload.username, admin_user_id: payload.admin_user_id });
  } catch {
    return res.json({ is_admin: false });
  }
});

// POST /api/admin/auth/login  { username, password }  -> returns { token }
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [[u]] = await conn.query(
      "SELECT user_id, role, username FROM User WHERE username = ? AND password = ? LIMIT 1",
      [String(username).trim(), String(password).trim()]
    );
    if (!u || u.role !== "admin") {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const token = jwt.sign(
      { admin_user_id: u.user_id, username: u.username, role: "admin" },
      process.env.ADMIN_JWT_SECRET || "dev_admin_secret_change",
      { expiresIn: "12h" }
    );
    // no cookies set — return token only
    res.json({ token });
  } catch (e) {
    console.error("admin login error:", e);
    res.status(500).json({ error: "db_error" });
  }
});

// POST /api/admin/auth/logout  -> client just drops the token
router.post("/logout", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
