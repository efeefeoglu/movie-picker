CREATE TABLE IF NOT EXISTS movies (
  id BIGSERIAL PRIMARY KEY,
  imdb_url TEXT UNIQUE NOT NULL,
  source_url TEXT,
  title TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  poster_url TEXT,
  metascore SMALLINT,
  imdb_rating NUMERIC(3,1),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'watched', 'alone')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE movies ALTER COLUMN poster_url DROP NOT NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS metascore SMALLINT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS imdb_rating NUMERIC(3,1);

CREATE INDEX IF NOT EXISTS movies_categories_gin ON movies USING GIN (categories);
