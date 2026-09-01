type OmdbResponse = { Response: "True" | "False"; Error?: string; imdbID?: string; Title?: string; Genre?: string; Poster?: string; Metascore?: string; imdbRating?: string };

function imdbIdFromUrl(imdbUrl: string) {
  const url = new URL(imdbUrl);
  if (!(url.hostname === "imdb.com" || url.hostname.endsWith(".imdb.com"))) throw new Error("Please enter a valid IMDb URL");
  const match = url.pathname.match(/^\/title\/(tt\d+)/);
  if (!match) throw new Error("Please enter an IMDb title page");
  return { id: match[1], imdbUrl: `https://www.imdb.com/title/${match[1]}/` };
}

function optionalNumber(value?: string) {
  if (!value || value === "N/A") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function fetchOmdbMovie(imdbUrl: string) {
  const { id, imdbUrl: canonicalUrl } = imdbIdFromUrl(imdbUrl);
  return fetchOmdb({ i: id }, canonicalUrl);
}

export async function findOmdbMovie(title: string, year?: string) {
  const query: Record<string, string> = { t: title, type: "movie" };
  if (year) query.y = year;
  let data = await requestOmdb(query);

  // Streaming services sometimes expose a re-release year. Retry by title so
  // a correct title is still useful when that year does not match IMDb's year.
  if (data.Response === "False" && year) data = await requestOmdb({ t: title, type: "movie" });
  if (data.Response === "False") throw new Error(data.Error || `No IMDb movie result was found for “${title}”.`);
  if (!data.imdbID) throw new Error("OMDb did not return an IMDb title ID");
  return movieFromResponse(data, `https://www.imdb.com/title/${data.imdbID}/`);
}

async function requestOmdb(query: Record<string, string>) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) throw new Error("OMDB_API_KEY is not configured");
  const endpoint = new URL("https://www.omdbapi.com/");
  endpoint.searchParams.set("apikey", apiKey);
  for (const [key, value] of Object.entries(query)) endpoint.searchParams.set(key, value);
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) throw new Error("OMDb could not be reached. Try again in a moment.");
  return (await response.json()) as OmdbResponse;
}

async function fetchOmdb(query: Record<string, string>, canonicalUrl: string) {
  const data = await requestOmdb(query);
  if (data.Response === "False") throw new Error(data.Error || "Movie details were not found");
  return movieFromResponse(data, canonicalUrl);
}

function movieFromResponse(data: OmdbResponse, canonicalUrl: string) {
  if (!data.Title) throw new Error("OMDb did not return a title for that movie");
  return {
    imdb_url: canonicalUrl,
    title: data.Title,
    categories: data.Genre && data.Genre !== "N/A" ? data.Genre.split(",").map((genre) => genre.trim()) : [],
    poster_url: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
    metascore: optionalNumber(data.Metascore),
    imdb_rating: optionalNumber(data.imdbRating),
  };
}
