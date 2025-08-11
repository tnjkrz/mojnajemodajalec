const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const conn = require("../dbconn");

// Ensure a user row has a session_hash; return it
async function ensureSessionHash(user_id) {
  const [[u]] = await conn.query("SELECT session_hash FROM User WHERE user_id = ?", [user_id]);
  if (u && u.session_hash) return u.session_hash;
  const sid = crypto.randomBytes(16).toString("hex");
  await conn.query("UPDATE User SET session_hash = ? WHERE user_id = ?", [sid, user_id]);
  return sid;
}

// Who am I (handy for the client)
router.get("/me", async (req, res) => {
  try {
    if (!req.user_id) return res.json({ user_id: null, role: "anonymous" });
    const [[u]] = await conn.query(
      "SELECT user_id, role, username FROM User WHERE user_id = ? LIMIT 1",
      [req.user_id]
    );
    if (!u) return res.json({ user_id: null, role: "anonymous" });
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: "db_error" });
  }
});

// Login (admin)
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "missing_fields" });

  try {
    const [[u]] = await conn.query(
      "SELECT user_id, role FROM User WHERE username = ? AND password = ? LIMIT 1",
      [username, password] // (simple for class project; hash in real life)
    );
    if (!u || u.role !== "admin") return res.status(401).json({ error: "invalid_credentials" });

    const sid = await ensureSessionHash(u.user_id);
    res.setHeader(
      "Set-Cookie",
      `sid=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("auth login error:", e);
    res.status(500).json({ error: "db_error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.setHeader("Set-Cookie", "sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ ok: true });
});

module.exports = router;
