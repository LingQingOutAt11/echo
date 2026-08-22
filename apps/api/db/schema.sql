CREATE TABLE IF NOT EXISTS rooms (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  room_id BIGINT REFERENCES rooms(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  nickname TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age BETWEEN 18 AND 100),
  city TEXT NOT NULL,
  job TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('恋爱', '朋友', '搭子')),
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  dimensions JSONB,
  animal JSONB,
  tags TEXT[] NOT NULL DEFAULT '{}',
  deal_breakers TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_answers (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  option_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, card_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES users(id),
  receiver_id BIGINT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dual_sessions (
  id TEXT PRIMARY KEY,
  user_a BIGINT NOT NULL REFERENCES users(id),
  user_b BIGINT NOT NULL REFERENCES users(id),
  rounds JSONB NOT NULL DEFAULT '[]',
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_purpose_idx ON users(purpose);
CREATE INDEX IF NOT EXISTS card_answers_user_idx ON card_answers(user_id);
