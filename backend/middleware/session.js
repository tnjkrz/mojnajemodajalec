const crypto = require("crypto");
const conn = require("../dbconn");

// cookie reader
function getCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v || "");
  }
  return "";
}

module.exports = async function session(req, res, next) {
  try {
    // try to read sid
    let sid = getCookie(req, "sid");

    if (!sid) {
      // create new session id + anonymous user
      sid = crypto.randomBytes(16).toString("hex"); 
      const [r] = await conn.query(
        "INSERT INTO User (role, username, password, is_banned, session_hash) VALUES ('anonymous', NULL, '', 0, ?)",
        [sid]
      );
      req.user_id = r.insertId;

      // set cookie 
      res.setHeader(
        "Set-Cookie",
        `sid=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`
      );
    } else {
      // find user by session_hash
      const [rows] = await conn.query(
        "SELECT user_id FROM User WHERE session_hash = ? LIMIT 1",
        [sid]
      );
      if (rows.length) {
        req.user_id = rows[0].user_id;
      } else {
        // cookie exists but no user then we recreate anonymous user bound to sid
        const [r] = await conn.query(
          "INSERT INTO User (role, username, password, is_banned, session_hash) VALUES ('anonymous', NULL, '', 0, ?)",
          [sid]
        );
        req.user_id = r.insertId;
      }
    }
  } catch (e) {
    console.error("session middleware error:", e);
    // continue anyway, just without user_id
  }
  next();
};
