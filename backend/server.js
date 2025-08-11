require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8210;

// CORS + JSON
app.use(cors({ origin: "http://localhost:8211", credentials: true }));
app.use(express.json());

// session cookie -> creates anonymous user if missing
const session = require("./middleware/session");
app.use(session);

// routes
app.use("/api/search", require("./routes/search"));
app.use("/api/landlords", require("./routes/landlords"));
app.use("/api/properties", require("./routes/properties"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/reports", require("./routes/reports"));


app.use((req, res) => res.status(404).json({ message: "404" }));
app.listen(port, () => console.log(`Server on ${port}`));
