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
  birth_datetime TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'female' CHECK (gender IN ('male', 'female')),
  zodiac TEXT NOT NULL DEFAULT '',
  mbti TEXT NOT NULL DEFAULT '',
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
  PRIMARY KEY (user_id, card_id, option_label)
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
CREATE TABLE IF NOT EXISTS proximity_sessions (
  id TEXT PRIMARY KEY,
  game JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proximity_peers (
  device_id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES proximity_sessions(id) ON DELETE SET NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proximity_peers_seen_idx ON proximity_peers(last_seen);

CREATE TABLE IF NOT EXISTS nfc_cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  transferred_at TIMESTAMPTZ,
  former_owner_ids BIGINT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dual_sessions ADD COLUMN IF NOT EXISTS game JSONB;
ALTER TABLE dual_sessions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'waiting';
ALTER TABLE dual_sessions ADD COLUMN IF NOT EXISTS destiny JSONB;
ALTER TABLE proximity_peers ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE proximity_peers ADD COLUMN IF NOT EXISTS dual_session_id TEXT REFERENCES dual_sessions(id) ON DELETE SET NULL;
ALTER TABLE nfc_cards ADD COLUMN IF NOT EXISTS former_owner_ids BIGINT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS nfc_cards_owner_idx ON nfc_cards(owner_id);
INSERT INTO nfc_cards (id, title, content) VALUES ('starter-01', '星光隐藏卡', '找到一颗只属于你们的星星。') ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS users_purpose_idx ON users(purpose);
CREATE INDEX IF NOT EXISTS card_answers_user_idx ON card_answers(user_id);
CREATE TABLE IF NOT EXISTS auth_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  token TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id BIGINT NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS messages_participant_idx ON messages(sender_id, receiver_id, created_at DESC);
