import { neon } from "@neondatabase/serverless";
import type { Movie, MovieStatus } from "./types";

function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
}

export async function ensureSchema() {
  await db()`CREATE TABLE IF NOT EXISTS movies (
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
  )`;
  await db()`ALTER TABLE movies ALTER COLUMN poster_url DROP NOT NULL`;
  await db()`ALTER TABLE movies ADD COLUMN IF NOT EXISTS source_url TEXT`;
  await db()`ALTER TABLE movies ADD COLUMN IF NOT EXISTS metascore SMALLINT`;
  await db()`ALTER TABLE movies ADD COLUMN IF NOT EXISTS imdb_rating NUMERIC(3,1)`;
  await db()`ALTER TABLE movies ADD COLUMN IF NOT EXISTS duration SMALLINT`;
  await db()`DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'movies_status_check'
        AND pg_get_constraintdef(oid) NOT LIKE '%secondary%'
    ) THEN
      ALTER TABLE movies DROP CONSTRAINT movies_status_check;
      ALTER TABLE movies ADD CONSTRAINT movies_status_check
        CHECK (status IN ('new', 'watched', 'alone', 'secondary'));
    END IF;
  END $$`;
}

export async function saveMovie(movie: Omit<Movie, "id" | "status" | "source_url">, sourceUrl?: string) {
  await ensureSchema();
  const rows = await db()`INSERT INTO movies (imdb_url, source_url, title, categories, poster_url, metascore, imdb_rating, duration)
    VALUES (${movie.imdb_url}, ${sourceUrl ?? null}, ${movie.title}, ${movie.categories}, ${movie.poster_url}, ${movie.metascore}, ${movie.imdb_rating}, ${movie.duration})
    ON CONFLICT (imdb_url) DO UPDATE SET title = EXCLUDED.title,
      source_url = COALESCE(EXCLUDED.source_url, movies.source_url),
      categories = EXCLUDED.categories, poster_url = EXCLUDED.poster_url,
      metascore = EXCLUDED.metascore, imdb_rating = EXCLUDED.imdb_rating, duration = EXCLUDED.duration
    RETURNING id::text, imdb_url, source_url, title, categories, poster_url, metascore, imdb_rating::float, duration, status`;
  return rows[0] as Movie;
}

export async function getCategories(includeSecondary = false) {
  await ensureSchema();
  const rows = await db()`SELECT category, COUNT(*)::int AS count FROM movies,
    UNNEST(categories) AS category WHERE status <> 'watched'
      AND (${includeSecondary} OR status <> 'secondary') GROUP BY category ORDER BY category`;
  return rows as { category: string; count: number }[];
}

export async function getRandomMovies(category: string, includeSecondary = false, limit = 4) {
  await ensureSchema();
  const rows = await db()`SELECT id::text, imdb_url, source_url, title, categories, poster_url, metascore, imdb_rating::float, duration, status
    FROM movies WHERE ${category} = ANY(categories) AND status <> 'watched'
      AND (${includeSecondary} OR status <> 'secondary') ORDER BY RANDOM() LIMIT ${limit}`;
  return rows as Movie[];
}

export async function updateMovieStatus(id: string, status: MovieStatus) {
  const rows = await db()`UPDATE movies SET status = ${status} WHERE id = ${id}
    RETURNING id::text, imdb_url, source_url, title, categories, poster_url, metascore, imdb_rating::float, duration, status`;
  return rows[0] as Movie | undefined;
}
