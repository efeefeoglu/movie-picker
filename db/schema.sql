CREATE TABLE IF NOT EXISTS movies (
  id BIGSERIAL PRIMARY KEY,
  imdb_url TEXT UNIQUE NOT NULL,
  source_url TEXT,
  title TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  poster_url TEXT,
  metascore SMALLINT,
  imdb_rating NUMERIC(3,1),
  duration SMALLINT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'watched', 'alone', 'secondary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE movies ALTER COLUMN poster_url DROP NOT NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS metascore SMALLINT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS imdb_rating NUMERIC(3,1);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS duration SMALLINT;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'movies_status_check'
      AND pg_get_constraintdef(oid) NOT LIKE '%secondary%'
  ) THEN
    ALTER TABLE movies DROP CONSTRAINT movies_status_check;
    ALTER TABLE movies ADD CONSTRAINT movies_status_check
      CHECK (status IN ('new', 'watched', 'alone', 'secondary'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS movies_categories_gin ON movies USING GIN (categories);
