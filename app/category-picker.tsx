"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Movie, MovieStatus } from "@/lib/types";

const statusLabels: Record<MovieStatus, string> = {
  new: "New",
  watched: "Watched",
  alone: "Watch alone",
};

export default function CategoryPicker({ categories }: { categories: { category: string; count: number }[] }) {
  const [active, setActive] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [trailerId, setTrailerId] = useState<string | null>(null);
  const [trailerError, setTrailerError] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);

  useEffect(() => {
    if (!trailerMovie) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setTrailerMovie(null);
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [trailerMovie]);

  async function choose(category: string) {
    setActive(category); setLoading(true);
    const response = await fetch(`/api/movies/random?category=${encodeURIComponent(category)}`);
    const result = await response.json();
    setMovies(result.movies ?? []); setLoading(false);
  }

  async function changeStatus(movie: Movie, status: MovieStatus) {
    if (status === movie.status) return;

    setUpdating(movie.id);
    setStatusError(null);
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
      setStatusError(`Could not update ${movie.title}. Please try again.`);
    } finally {
      setUpdating(null);
    }
  }

  async function openTrailer(movie: Movie) {
    setTrailerMovie(movie); setTrailerId(null); setTrailerError(null); setTrailerLoading(true);
    try {
      const response = await fetch(`/api/trailers?title=${encodeURIComponent(movie.title)}`);
      const result = await response.json();
      if (!response.ok || !result.videoId) throw new Error(result.error ?? "No trailer found");
      setTrailerId(result.videoId);
    } catch (error) {
      setTrailerError(error instanceof Error ? error.message : "Could not load this trailer");
    } finally { setTrailerLoading(false); }
  }

  function closeTrailer() {
    setTrailerMovie(null); setTrailerId(null); setTrailerError(null);
  }

  return <>
    <div className="genres">
      {categories.map(({ category, count }) => <button className={active === category ? "active" : ""} key={category} onClick={() => choose(category)}><span>{category}</span><small>{count} film{count === 1 ? "" : "s"}</small></button>)}
    </div>
    {active && <section className="results">
      <div className="results-title"><div><div className="eyebrow">Our picks</div><h2>Four for tonight</h2></div><button onClick={() => choose(active)}>↻ Shuffle again</button></div>
      {statusError && <p className="status-error" role="alert">{statusError}</p>}
      {loading ? <div className="loading">Shuffling the deck…</div> : <div className="movie-grid">{movies.map(movie => <article key={movie.id} className="movie-card">
        <button className="poster poster-link" type="button" onClick={() => openTrailer(movie)} aria-label={`Watch the trailer for ${movie.title}`}>
          {movie.poster_url ? <Image src={movie.poster_url} alt={`${movie.title} poster`} fill sizes="(max-width: 700px) 50vw, 25vw" /> : <span className="no-poster">No poster available</span>}
          <span className="trailer-cue"><span aria-hidden="true">▶</span> Watch trailer</span>
        </button>
        <div className="movie-meta">
          <label className={`status-control ${movie.status}`}>
            <span className="sr-only">Status for {movie.title}</span>
            <select value={movie.status} disabled={updating === movie.id} onChange={event => changeStatus(movie, event.target.value as MovieStatus)}>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <h3>{movie.title}</h3><p>{movie.categories.join(" · ")}</p><div className="ratings"><span>IMDb <b>{movie.imdb_rating ?? "—"}</b></span><span>Metascore <b>{movie.metascore ?? "—"}</b></span></div>
          {movie.source_url && <a className="watch-link" href={movie.source_url} target="_blank" rel="noreferrer">Watch <span aria-hidden="true">↗</span></a>}</div>
      </article>)}</div>}
    </section>}
    {trailerMovie && <div className="trailer-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && closeTrailer()}>
      <section className="trailer-modal" role="dialog" aria-modal="true" aria-labelledby="trailer-title">
        <div className="trailer-head"><div><div className="eyebrow">Now playing</div><h2 id="trailer-title">{trailerMovie.title}</h2></div><button type="button" onClick={closeTrailer} aria-label="Close trailer">×</button></div>
        <div className="trailer-frame">
          {trailerLoading && <div className="trailer-message">Searching YouTube for the best trailer…</div>}
          {trailerError && <div className="trailer-message trailer-error"><b>Trailer unavailable</b><span>{trailerError}</span></div>}
          {trailerId && <iframe src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1`} title={`${trailerMovie.title} trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
        </div>
      </section>
    </div>}
  </>;
}
