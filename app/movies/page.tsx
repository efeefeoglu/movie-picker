import { getAllMovies } from "@/lib/db";
import type { Movie } from "@/lib/types";
import AllMovies from "./all-movies";

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  let movies: Movie[] = [];
  let configured = true;

  try {
    movies = await getAllMovies();
  } catch {
    configured = false;
  }

  return (
    <main className="movies-page">
      <div className="eyebrow">The full collection</div>
      <div className="movies-page-head">
        <h1>All <em>movies.</em></h1>
        <p>{movies.length} film{movies.length === 1 ? "" : "s"} in your screening room.</p>
      </div>
      {!configured ? (
        <div className="empty"><b>Connect your Neon database</b><p>Add <code>DATABASE_URL</code> to view your collection.</p></div>
      ) : movies.length ? (
        <AllMovies initialMovies={movies} />
      ) : (
        <div className="empty"><b>Your screening room is empty.</b><p>Add an IMDb film and it will appear here.</p><a href="/add">Add your first film →</a></div>
      )}
    </main>
  );
}
