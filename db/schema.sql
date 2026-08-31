CREATE TABLE IF NOT EXISTS movies (
  id BIGSERIAL PRIMARY KEY,
  imdb_url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  poster_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'watched', 'alone')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS movies_categories_gin ON movies USING GIN (categories);
