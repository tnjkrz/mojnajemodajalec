require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8210;

// CORS + JSON
app.use(
  cors({
    origin: "http://localhost:8211",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"], // allow admin JWT header
  })
);
app.use(express.json());

// session cookie --> creates anonymous user if missing (for normal users)
const session = require("./middleware/session");
const banGuard = require("./middleware/ban-guard");
app.use(session);

// routes
app.use("/api/search", require("./routes/search"));
app.use("/api/reviews", banGuard, require("./routes/reviews"));
app.use("/api/reports", banGuard, require("./routes/reports"));
app.use("/api/landlords", banGuard, require("./routes/landlords"));
app.use("/api/properties", banGuard, require("./routes/properties"));

// admin auth (no cookies, JWT in Authorization header)
app.use("/api/admin/auth", require("./routes/adminAuth"));
// protected admin operations  --> uses JWT, enforced inside the file
app.use("/api/admin", require("./routes/admin"));

app.use((req, res) => res.status(404).json({ message: "404" }));
app.listen(port, () => console.log(`Server on ${port}`));
