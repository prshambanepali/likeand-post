const express = require("express");
const cors = require("cors");

const { PORT, CLIENT_ORIGIN } = require("./config/env");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const postRoutes = require("./routes/post.routes");

const app = express();

app.use(
  cors({ origin: [CLIENT_ORIGIN, "http://127.0.0.1:5500"], credentials: true })
);
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/posts", postRoutes);

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
