"use client";

import Image from "next/image";
import { useState } from "react";
import type { Movie } from "@/lib/types";

export default function HeroPicker({ configured }: { configured: boolean }) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState("");

  async function roll() {
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
        {movie.source_url && <a className="watch-link" href={movie.source_url} target="_blank" rel="noreferrer">Watch now <span aria-hidden="true">↗</span></a>}
      </div>}
      <button className="roll-button" type="button" onClick={roll} disabled={rolling || !configured}>
        <span>{rolling ? "Rolling…" : movie ? "Roll again" : "Roll the dice"}</span>
      </button>
      {error && <p className="hero-error" role="alert">{error}</p>}
    </div>
    {rolling && <div className="dice-stage" aria-label="Rolling the dice" role="status"><div className="dice"><i /><i /><i /><i /><i /><i /></div></div>}
    {movie && !rolling && <div className="hero-poster">
      {movie.poster_url ? <Image src={movie.poster_url} alt={`${movie.title} poster`} fill priority sizes="(max-width: 750px) 55vw, 28vw" /> : <span>No poster available</span>}
    </div>}
  </div>;
}
