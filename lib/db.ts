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
    title TEXT NOT NULL,
    categories TEXT[] NOT NULL DEFAULT '{}',
    poster_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'watched', 'alone')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export async function saveMovie(movie: Omit<Movie, "id" | "status">) {
  await ensureSchema();
  const rows = await db()`INSERT INTO movies (imdb_url, title, categories, poster_url)
    VALUES (${movie.imdb_url}, ${movie.title}, ${movie.categories}, ${movie.poster_url})
    ON CONFLICT (imdb_url) DO UPDATE SET title = EXCLUDED.title,
      categories = EXCLUDED.categories, poster_url = EXCLUDED.poster_url
    RETURNING id::text, imdb_url, title, categories, poster_url, status`;
  return rows[0] as Movie;
}

export async function getCategories() {
  await ensureSchema();
  const rows = await db()`SELECT category, COUNT(*)::int AS count FROM movies,
    UNNEST(categories) AS category GROUP BY category ORDER BY category`;
  return rows as { category: string; count: number }[];
}

export async function getRandomMovies(category: string, limit = 4) {
  await ensureSchema();
  const rows = await db()`SELECT id::text, imdb_url, title, categories, poster_url, status
    FROM movies WHERE ${category} = ANY(categories) ORDER BY RANDOM() LIMIT ${limit}`;
  return rows as Movie[];
}

export async function updateMovieStatus(id: string, status: MovieStatus) {
  const rows = await db()`UPDATE movies SET status = ${status} WHERE id = ${id}
    RETURNING id::text, imdb_url, title, categories, poster_url, status`;
  return rows[0] as Movie | undefined;
}
