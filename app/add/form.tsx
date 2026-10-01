"use client";

import { FormEvent, useState } from "react";
import type { Movie } from "@/lib/types";

export default function AddMovieForm() {
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setSaved(null); setLoading(true);
    const form = new FormData(event.currentTarget);
    const sourceUrl = form.get("sourceUrl");
    const response = await fetch("/api/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: form.get("url"), sourceUrl: sourceUrl || undefined }),
    });
    const data = await response.json(); setLoading(false);
    if (!response.ok) setMessage(data.error ?? "Something went wrong");
    else { setSaved(data.movie); event.currentTarget.reset(); }
  }

  return <form className="imdb-form" onSubmit={submit}>
    <div className="add-movie-fields">
      <label htmlFor="url">IMDb page URL
        <input id="url" name="url" type="url" required placeholder="https://www.imdb.com/title/tt0111161/" />
      </label>
      <label htmlFor="sourceUrl">Source URL <small>Optional</small>
        <input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://mubi.com/en/films/…" />
      </label>
      <button disabled={loading}>{loading ? "Fetching…" : "Add to collection"}</button>
    </div>
    {message && <p className="form-error">{message}</p>}
    {saved && <p className="form-success">✓ <b>{saved.title}</b> was added with status “new”.</p>}
  </form>;
}
