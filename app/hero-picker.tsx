"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Movie } from "@/lib/types";

export default function HeroPicker({ configured }: { configured: boolean }) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState("");

  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerId, setTrailerId] = useState<string | null>(null);
  const [trailerError, setTrailerError] = useState("");

  useEffect(() => {
    if (!trailerOpen || !movie) return;
    const title = movie.title;
    const controller = new AbortController();
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTrailerOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    async function loadTrailer() {
      try {
        const response = await fetch(`/api/trailers?title=${encodeURIComponent(title)}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.videoId) throw new Error(result.error ?? "No trailer found");
        if (!controller.signal.aborted) setTrailerId(result.videoId);
      } catch (cause) {
        if (!controller.signal.aborted) setTrailerError(cause instanceof Error ? cause.message : "Could not load this trailer");
      }
    }
    loadTrailer();
    return () => {
      controller.abort();
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [trailerOpen, movie]);

  function openTrailer() {
    setTrailerId(null);
    setTrailerError("");
    setTrailerOpen(true);
  }

  async function roll() {
    setTrailerOpen(false);
    setRolling(true);
    setError("");
    setMovie(null);
    const delay = new Promise(resolve => setTimeout(resolve, 1200));
    try {
      const [response] = await Promise.all([fetch("/api/movies/random"), delay]);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not pick a movie");
      if (!result.movie) throw new Error("No unwatched films are available yet.");
      setMovie(result.movie);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not pick a movie");
    } finally {
      setRolling(false);
    }
  }

  return <div className={`hero-picker ${movie ? "has-pick" : ""}`}>
    <div className="hero-copy">
      <div className="eyebrow">Tonight&apos;s feature presentation</div>
      <h1>{movie ? <>Tonight, watch<br /><em>{movie.title}</em></> : <>Your next film.<br /><em>One roll away.</em></>}</h1>
      {!movie && <p>One movie from your unwatched collection. No genres, no shortlist, no second guessing.</p>}
      {movie && <div className="hero-movie-details">
        <p>{movie.categories.join(" · ")}</p>
        <div className="ratings"><span>IMDb <b>{movie.imdb_rating ?? "—"}</b></span><span>Metascore <b>{movie.metascore ?? "—"}</b></span><span>Runtime <b>{movie.duration ? `${movie.duration} min` : "—"}</b></span></div>
        <a className="watch-link" href={movie.imdb_url} target="_blank" rel="noreferrer">IMDb <span aria-hidden="true">↗</span></a>
        {movie.source_url && <a className="watch-link" href={movie.source_url} target="_blank" rel="noreferrer">Watch now <span aria-hidden="true">↗</span></a>}
      </div>}
      <button className="roll-button" type="button" onClick={roll} disabled={rolling || !configured}>
        <span>{rolling ? "Rolling…" : movie ? "Roll again" : "Roll the dice"}</span>
      </button>
      {error && <p className="hero-error" role="alert">{error}</p>}
    </div>
    {rolling && <div className="dice-stage" aria-label="Rolling the dice" role="status"><div className="dice"><i /><i /><i /><i /><i /><i /></div></div>}
    {movie && !rolling && <button className="hero-poster poster-link" type="button" onClick={openTrailer} aria-label={`Watch the trailer for ${movie.title}`}>
      {movie.poster_url ? <Image src={movie.poster_url} alt={`${movie.title} poster`} fill priority sizes="(max-width: 750px) 55vw, 28vw" /> : <span>No poster available</span>}
      <span className="trailer-cue"><span aria-hidden="true">▶</span> Watch trailer</span>
    </button>}
    {trailerOpen && movie && createPortal(<div className="trailer-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setTrailerOpen(false)}>
      <section className="trailer-modal" role="dialog" aria-modal="true" aria-labelledby="hero-trailer-title">
        <div className="trailer-head"><div><div className="eyebrow">Now playing</div><h2 id="hero-trailer-title">{movie.title}</h2></div><button type="button" autoFocus onClick={() => setTrailerOpen(false)} aria-label="Close trailer">×</button></div>
        <div className="trailer-frame">
          {!trailerId && !trailerError && <div className="trailer-message" role="status">Searching YouTube for the best trailer…</div>}
          {trailerError && <div className="trailer-message trailer-error" role="alert"><b>Trailer unavailable</b><span>{trailerError}</span></div>}
          {trailerId && <iframe src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1`} title={`${movie.title} trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
        </div>
      </section>
    </div>, document.body)}
  </div>;
}
