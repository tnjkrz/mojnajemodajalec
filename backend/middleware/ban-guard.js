const conn = require("../dbconn");

module.exports = async function banGuard(req, res, next) {
  try {
    if (!req.user_id) return next(); // anonymous should have a user row via session
    const [[u]] = await conn.query(
      "SELECT is_banned FROM User WHERE user_id = ? LIMIT 1",
      [req.user_id]
    );
    if (u && Number(u.is_banned) === 1) {
      return res.status(403).json({ error: "banned" });
    }
  } catch (e) {
    console.error("banGuard error:", e);
  }
  next();
};
// This middleware checks if the user is banned and prevents access if so