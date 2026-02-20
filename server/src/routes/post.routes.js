const express = require("express");
const db = require("../db/db");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

/**
 * GET /api/posts
 * Who can view? INVESTOR, ADMIN, STARTUP, INTERN_SEEKER, INFLUENCER (all logged in)
 * Admin sees hidden; others do not.
 */
router.get("/", requireAuth, async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";

  const q = `
    SELECT 
      p.*,
      u.full_name,
      u.email,

      -- total likes
      (SELECT COUNT(*) FROM post_interests i WHERE i.post_id = p.id) AS interest_count,

      -- did current user like it?
      EXISTS (
        SELECT 1 FROM post_interests i 
        WHERE i.post_id = p.id AND i.investor_id = $1
      ) AS liked_by_me

    FROM posts p
    JOIN users u ON u.id = p.author_id
    ${isAdmin ? "" : "WHERE p.is_hidden = FALSE"}
    ORDER BY p.created_at DESC
  `;

  const { rows } = await db.query(q, [req.user.id]);

  res.json({ posts: rows });
});

/**
 * POST /api/posts
 * Only STARTUP (and ADMIN if you want).
 */
router.post("/", requireAuth, requireRole("STARTUP"), async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body)
    return res.status(400).json({ message: "title and body required" });

  const { rows } = await db.query(
    `INSERT INTO posts (author_id, title, body)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [req.user.id, title.trim(), body.trim()]
  );

  res.json({ post: rows[0] });
});

/**
 * GET /api/posts/mine
 * Startup sees their own posts (including hidden), Admin can also use it if needed.
 */
router.get("/mine", requireAuth, requireRole("STARTUP"), async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM posts WHERE author_id=$1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ posts: rows });
});

/**
 * PATCH /api/posts/:id/hide
 * Admin only: hide/unhide a post.
 */
router.patch(
  "/:id/hide",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const { id } = req.params;
    const { is_hidden } = req.body;

    const { rows } = await db.query(
      `UPDATE posts SET is_hidden=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [!!is_hidden, id]
    );

    if (!rows[0]) return res.status(404).json({ message: "Post not found" });
    res.json({ post: rows[0] });
  }
);

/**
 * DELETE /api/posts/:id
 * Admin only: delete a post.
 */
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const r = await db.query(`DELETE FROM posts WHERE id=$1 RETURNING id`, [id]);
  if (!r.rows[0]) return res.status(404).json({ message: "Post not found" });
  res.json({ ok: true });
});

/**
 * POST /api/posts/:id/save
 * Investor only: save/bookmark a post.
 */
router.post(
  "/:id/save",
  requireAuth,
  requireRole("INVESTOR"),
  async (req, res) => {
    const { id } = req.params;

    await db.query(
      `INSERT INTO saved_posts (user_id, post_id)
     VALUES ($1,$2)
     ON CONFLICT (user_id, post_id) DO NOTHING`,
      [req.user.id, id]
    );

    res.json({ ok: true });
  }
);

/**
 * DELETE /api/posts/:id/save
 * Investor only: unsave
 */
router.delete(
  "/:id/save",
  requireAuth,
  requireRole("INVESTOR"),
  async (req, res) => {
    const { id } = req.params;

    await db.query(`DELETE FROM saved_posts WHERE user_id=$1 AND post_id=$2`, [
      req.user.id,
      id,
    ]);

    res.json({ ok: true });
  }
);

/**
 * GET /api/posts/saved
 * Investor only: list saved posts
 */
router.get(
  "/saved/list",
  requireAuth,
  requireRole("INVESTOR"),
  async (req, res) => {
    const { rows } = await db.query(
      `
    SELECT p.*, u.full_name, u.email
    FROM saved_posts s
    JOIN posts p ON p.id = s.post_id
    JOIN users u ON u.id = p.author_id
    WHERE s.user_id=$1
    ORDER BY s.created_at DESC
    `,
      [req.user.id]
    );
    res.json({ posts: rows });
  }
);

router.post(
  "/:id/interested",
  requireAuth,
  requireRole("INVESTOR"),
  async (req, res) => {
    const { id } = req.params;

    // Check if already interested
    const existing = await db.query(
      `SELECT * FROM post_interests WHERE post_id=$1 AND investor_id=$2`,
      [id, req.user.id]
    );

    if (existing.rows[0]) {
      // Unlike
      await db.query(
        `DELETE FROM post_interests WHERE post_id=$1 AND investor_id=$2`,
        [id, req.user.id]
      );
      return res.json({ liked: false });
    } else {
      // Like
      await db.query(
        `INSERT INTO post_interests (post_id, investor_id)
       VALUES ($1,$2)`,
        [id, req.user.id]
      );
      return res.json({ liked: true });
    }
  }
);

router.delete(
  "/:id/interested",
  requireAuth,
  requireRole("INVESTOR"),
  async (req, res) => {
    const { id } = req.params;
    await db.query(
      `DELETE FROM post_interests WHERE post_id=$1 AND investor_id=$2`,
      [id, req.user.id]
    );
    res.json({ ok: true });
  }
);

router.get(
  "/mine/interests",
  requireAuth,
  requireRole("STARTUP"),
  async (req, res) => {
    const { rows } = await db.query(
      `
    SELECT
      i.post_id,
      i.created_at,
      i.message,
      u.id as investor_id,
      u.full_name,
      u.email
    FROM post_interests i
    JOIN posts p ON p.id = i.post_id
    JOIN users u ON u.id = i.investor_id
    WHERE p.author_id = $1
    ORDER BY i.created_at DESC
    `,
      [req.user.id]
    );

    res.json({ interests: rows });
  }
);

router.get("/:id/interests", requireAuth, async (req, res) => {
  if (req.user.role !== "STARTUP" && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { id } = req.params;

  const { rows } = await db.query(
    `
    SELECT u.id, u.full_name, u.email, i.created_at
    FROM post_interests i
    JOIN users u ON u.id = i.investor_id
    WHERE i.post_id=$1
    ORDER BY i.created_at DESC
    `,
    [id]
  );

  res.json({ investors: rows });
});
module.exports = router;
