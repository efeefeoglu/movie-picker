# ReelPick

A personal movie picker that imports IMDb title metadata through the OMDb API, stores it in Neon Postgres, and serves four random suggestions by genre.

## Setup

1. Create a Neon database and copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to your Neon connection string, `OMDB_API_KEY` to an [OMDb API key](https://www.omdbapi.com/apikey.aspx), and `YOUTUBE_API_KEY` to a YouTube Data API v3 key. The YouTube key powers the trailer search shown when a poster is selected. If that key has a website restriction, optionally set `YOUTUBE_API_REFERER` to the registered production origin (for example, `https://movie-picker.example.com/`); otherwise the trailer endpoint uses the current request origin.
3. Install and run:

```bash
npm install
npm run dev
```

The app creates the `movies` table on first use. You can alternatively run `db/schema.sql` in the Neon SQL editor. Movie statuses are `new` (the default), `watched`, and `alone`.

OMDb provides the movie title, comma-separated genres, poster URL, Metascore, and IMDb rating. Existing databases are migrated automatically with nullable `metascore SMALLINT` and `imdb_rating NUMERIC(3,1)` columns; `poster_url` is made nullable because OMDb can return `N/A`.

## API

- `POST /api/movies` with `{ "url": "https://www.imdb.com/title/tt.../", "sourceUrl": "https://mubi.com/..." }` imports a film. `sourceUrl` is optional and is displayed as the film's Watch link.
- `GET /api/movies/random?category=Drama` returns up to four random films.
- `PATCH /api/movies/:id` with `{ "status": "watched" }` updates its status.
- `GET /api/trailers?title=Movie%20Title` finds the most relevant embeddable YouTube trailer.

## Chrome extension for streaming services

The unpacked extension in `chrome-extension/` adds the film on the current MUBI, Prime Video, Netflix, or Max (including legacy `hbomax.com` links) page without copying an IMDb URL by hand. It reads the service's movie metadata, finds the closest IMDb title (preferring the detected release year), and sends the IMDb URL and current streaming page URL to the app. Suggestions imported this way include a **Watch** link back to that page.

1. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
2. Select this repository's `chrome-extension` directory.
3. Pin **ReelPick for streaming**, visit a film page on MUBI, Prime Video, Netflix, or Max, and click the extension.
4. The film is added directly to the ReelPick app at `https://movie-picker-lyart.vercel.app/`.

Page contents are read only after the toolbar button is clicked, using Chrome's `activeTab` permission. Network access is limited to IMDb title search and the deployed ReelPick app.
