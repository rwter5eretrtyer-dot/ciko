CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL, password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','editor','admin')),
  blocked BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens(user_id);
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE TABLE genres (
  id SERIAL PRIMARY KEY, slug VARCHAR(60) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL
);
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '', kind VARCHAR(12) NOT NULL DEFAULT 'movie' CHECK (kind IN ('movie','series')),
  release_year INT NOT NULL CHECK(release_year BETWEEN 1888 AND 2200),
  duration_minutes INT NOT NULL DEFAULT 1 CHECK(duration_minutes > 0),
  age_rating INT NOT NULL DEFAULT 0 CHECK(age_rating IN (0,6,12,16,18)),
  poster_url TEXT, backdrop_url TEXT, video_url TEXT,
  source_type VARCHAR(12) NOT NULL DEFAULT 'external' CHECK(source_type IN ('external','upload','embed')),
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX movies_title_lower_idx ON movies(LOWER(title));
CREATE INDEX movies_year_idx ON movies(release_year);
CREATE INDEX movies_created_idx ON movies(created_at DESC);
CREATE TABLE movie_genres (
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  genre_id INT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id,genre_id)
);
CREATE INDEX movie_genres_genre_idx ON movie_genres(genre_id);
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(user_id,movie_id)
);
CREATE TABLE watch_history (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  progress_seconds INT NOT NULL DEFAULT 0 CHECK(progress_seconds >= 0),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id,movie_id)
);
CREATE INDEX watch_history_updated_idx ON watch_history(updated_at DESC);
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5), body VARCHAR(1200) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id,movie_id)
);
CREATE INDEX reviews_movie_idx ON reviews(movie_id);
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY, user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, entity VARCHAR(80) NOT NULL, entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at DESC);
