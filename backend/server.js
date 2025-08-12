// backend/server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
// When serving frontend from the same origin/port, CORS is not needed.
// const cors = require("cors");

const app = express();

// ===== JSON & (optional) CORS =====
// app.use(cors({ origin: process.env.FRONT_ORIGIN || "http://88.200.63.148:8211", credentials: true }));
app.use(express.json());

// ===== Session cookie for normal users =====
const session = require("./middleware/session");
app.use(session);

// ===== API routes =====
app.use("/api/search", require("./routes/search"));
app.use("/api/landlords", require("./routes/landlords"));
app.use("/api/properties", require("./routes/properties"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/admin/auth", require("./routes/adminAuth"));
app.use("/api/admin", require("./routes/admin"));

// Simple helper for sanity check
app.get("/api/whoami", (req, res) => {
  res.json({ user_id: req.user_id || null });
});

// ===== Serve React build (single-port deployment) =====
const buildDir = path.join(__dirname, "build");
app.use(express.static(buildDir));

// SPA fallback: any non-API GET should return index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

// API 404s (must be after routes)
app.use("/api", (_req, res) => res.status(404).json({ message: "404" }));

// ===== Listen =====
const port = Number(process.env.PORT || 8211);
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
