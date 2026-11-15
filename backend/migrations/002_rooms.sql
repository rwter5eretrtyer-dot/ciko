-- Комнаты: каждый зритель может создать свою комнату и поделиться кодом.
-- Миграция не удаляет старые фильмы, пользователей или просмотры.
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(12) NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  title VARCHAR(120) NOT NULL,
  video_url TEXT,
  source_type VARCHAR(12) CHECK (source_type IN ('external','upload','embed')),
  playing BOOLEAN NOT NULL DEFAULT FALSE,
  position_seconds DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  state_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX rooms_owner_idx ON rooms(owner_id,created_at DESC);
CREATE INDEX rooms_movie_idx ON rooms(movie_id);
CREATE TABLE room_members (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(room_id,user_id)
);
CREATE INDEX room_members_user_idx ON room_members(user_id,joined_at DESC);
CREATE TABLE room_messages (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX room_messages_idx ON room_messages(room_id,id DESC);
