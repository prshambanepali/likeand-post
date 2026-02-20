CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('INVESTOR', 'STARTUP', 'INTERN_SEEKER', 'INFLUENCER', 'ADMIN');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,

  role user_role NOT NULL DEFAULT 'INTERN_SEEKER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  auth_provider TEXT NOT NULL DEFAULT 'local', -- 'local' or 'google'
  google_id TEXT UNIQUE,
  avatar_url TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =========================
-- POSTS (startup ideas)
-- =========================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);

-- =========================
-- SAVED (investor bookmarks)
-- =========================
CREATE TABLE IF NOT EXISTS saved_posts (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_post ON saved_posts(post_id);
-- =========================
-- INVESTOR INTEREST (CTA)
-- =========================
CREATE TABLE IF NOT EXISTS post_interests (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  PRIMARY KEY (post_id, investor_id)
);

CREATE INDEX IF NOT EXISTS idx_interest_post ON post_interests(post_id);
CREATE INDEX IF NOT EXISTS idx_interest_investor ON post_interests(investor_id);