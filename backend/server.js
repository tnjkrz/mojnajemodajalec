// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// ===== CORS =====
// Allow your deployed frontend to talk to the API with cookies
const FRONT_ORIGIN =
  process.env.FRONT_ORIGIN || "http://88.200.63.148:8211";
app.use(cors({ origin: FRONT_ORIGIN, credentials: true }));

app.use(express.json());

// ===== Session cookie middleware (creates anonymous user if needed) =====
const session = require("./middleware/session");
app.use(session);

// ===== Routes =====
app.use("/api/search", require("./routes/search"));
app.use("/api/landlords", require("./routes/landlords"));
app.use("/api/properties", require("./routes/properties"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/reports", require("./routes/reports"));

// Admin auth + admin APIs (JWT, no sid for admin)
app.use("/api/admin/auth", require("./routes/adminAuth"));
app.use("/api/admin", require("./routes/admin"));

// Health / whoami helpers (nice to have)
app.get("/api/whoami", (req, res) => {
  res.json({
    user_id: req.user_id || null,
    is_admin: false, // this endpoint is for regular session; admin uses /api/admin/auth/me
  });
});

// 404
app.use((req, res) => res.status(404).json({ message: "404" }));

// ===== Listen on all interfaces =====
const port = Number(process.env.PORT || 8210);
app.listen(port, "0.0.0.0", () => {
  console.log(`API server listening on http://0.0.0.0:${port}`);
  console.log(`CORS allowed origin: ${FRONT_ORIGIN}`);
});
