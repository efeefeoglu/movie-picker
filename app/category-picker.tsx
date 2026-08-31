"use client";

import Image from "next/image";
import { useState } from "react";
import type { Movie } from "@/lib/types";

export default function CategoryPicker({ categories }: { categories: { category: string; count: number }[] }) {
  const [active, setActive] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  async function choose(category: string) {
    setActive(category); setLoading(true);
    const response = await fetch(`/api/movies/random?category=${encodeURIComponent(category)}`);
    const result = await response.json();
    setMovies(result.movies ?? []); setLoading(false);
  }

  return <>
    <div className="genres">
      {categories.map(({ category, count }) => <button className={active === category ? "active" : ""} key={category} onClick={() => choose(category)}><span>{category}</span><small>{count} film{count === 1 ? "" : "s"}</small></button>)}
    </div>
    {active && <section className="results">
      <div className="results-title"><div><div className="eyebrow">Our picks</div><h2>Four for tonight</h2></div><button onClick={() => choose(active)}>↻ Shuffle again</button></div>
      {loading ? <div className="loading">Shuffling the deck…</div> : <div className="movie-grid">{movies.map(movie => <article key={movie.id} className="movie-card">
        <div className="poster"><Image src={movie.poster_url} alt={`${movie.title} poster`} fill sizes="(max-width: 700px) 50vw, 25vw" /></div>
        <div className="movie-meta"><span className={`status ${movie.status}`}>{movie.status}</span><h3>{movie.title}</h3><p>{movie.categories.join(" · ")}</p></div>
      </article>)}</div>}
    </section>}
  </>;
}
