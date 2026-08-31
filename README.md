# ReelPick

A personal movie picker that imports title metadata from IMDb, stores it in Neon Postgres, and serves four random suggestions by genre.

## Setup

1. Create a Neon database and copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to your Neon connection string.
3. Install and run:

```bash
npm install
npm run dev
```

The app creates the `movies` table on first use. You can alternatively run `db/schema.sql` in the Neon SQL editor. Movie statuses are `new` (the default), `watched`, and `alone`.

## API

- `POST /api/movies` with `{ "url": "https://www.imdb.com/title/tt.../" }` imports a film.
- `GET /api/movies/random?category=Drama` returns up to four random films.
- `PATCH /api/movies/:id` with `{ "status": "watched" }` updates its status.
