import AddMovieForm from "./form";

export default function AddMovie() {
  return <main className="add-page">
    <div className="eyebrow">Build your collection</div>
    <h1>Add a <em>film.</em></h1>
    <p>Paste an IMDb title page below. We&apos;ll use OMDb to collect its title, genres, poster, Metascore, and IMDb rating, then tuck it safely into your screening room.</p>
    <AddMovieForm />
    <div className="steps"><div><b>01</b><span>Find a film on IMDb</span></div><div><b>02</b><span>Copy the page URL</span></div><div><b>03</b><span>Paste &amp; save</span></div></div>
  </main>;
}
