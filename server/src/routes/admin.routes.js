const express = require("express");
const db = require("../db/db");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();
const ROLES = ["INVESTOR", "STARTUP", "INTERN_SEEKER", "INFLUENCER", "ADMIN"];

router.get("/users", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { rows } = await db.query(
    "SELECT id, full_name, email, role, is_active, auth_provider, created_at FROM users ORDER BY created_at DESC"
  );
  res.json({ users: rows });
});

router.patch(
  "/users/:id/role",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!ROLES.includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const { rows } = await db.query(
      "UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2 RETURNING id, email, full_name, role, is_active, auth_provider",
      [role, id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found" });

    res.json({ user: rows[0] });
  }
);

router.patch(
  "/users/:id/active",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    const { rows } = await db.query(
      "UPDATE users SET is_active=$1, updated_at=NOW() WHERE id=$2 RETURNING id, email, full_name, role, is_active, auth_provider",
      [!!is_active, id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found" });

    res.json({ user: rows[0] });
  }
);

module.exports = router;
