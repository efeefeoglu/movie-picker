"use client";

import Image from "next/image";
import { useState } from "react";
import type { Movie, MovieStatus } from "@/lib/types";

const statusLabels: Record<MovieStatus, string> = {
  new: "New",
  watched: "Watched",
  alone: "Watch alone",
  secondary: "Secondary",
};

export default function AllMovies({ initialMovies }: { initialMovies: Movie[] }) {
  const [movies, setMovies] = useState(initialMovies);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(movie: Movie, status: MovieStatus) {
    if (status === movie.status) return;
    setUpdating(movie.id);
    setError(null);
    try {
      const response = await fetch(`/api/movies/${movie.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Status update failed");
      const result = await response.json();
      setMovies(current => current.map(item => item.id === movie.id ? result.movie : item));
    } catch {
      setError(`Could not update ${movie.title}. Please try again.`);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <>
      {error && <p className="status-error" role="alert">{error}</p>}
      <div className="movie-grid library-grid">
        {movies.map(movie => (
          <article key={movie.id} className="movie-card">
            <a className="poster poster-link" href={movie.imdb_url} target="_blank" rel="noreferrer" aria-label={`View ${movie.title} on IMDb`}>
              {movie.poster_url ? <Image src={movie.poster_url} alt={`${movie.title} poster`} fill sizes="(max-width: 700px) 50vw, 25vw" /> : <span className="no-poster">No poster available</span>}
              <span className="trailer-cue"><span aria-hidden="true">↗</span> View on IMDb</span>
            </a>
            <div className="movie-meta">
              <label className={`status-control ${movie.status}`}>
                <span className="sr-only">Status for {movie.title}</span>
                <select value={movie.status} disabled={updating === movie.id} onChange={event => changeStatus(movie, event.target.value as MovieStatus)}>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <h2>{movie.title}</h2>
              <p>{movie.categories.join(" · ")}</p>
              <div className="ratings"><span>IMDb <b>{movie.imdb_rating ?? "—"}</b></span><span>Metascore <b>{movie.metascore ?? "—"}</b></span><span>Runtime <b>{movie.duration ? `${movie.duration} min` : "—"}</b></span></div>
              {movie.source_url && <a className="watch-link" href={movie.source_url} target="_blank" rel="noreferrer">Watch <span aria-hidden="true">↗</span></a>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
