import * as cheerio from "cheerio";

type ImdbJson = { name?: string; image?: string; genre?: string | string[] };

export async function scrapeImdb(imdbUrl: string) {
  const url = new URL(imdbUrl);
  if (!(url.hostname === "imdb.com" || url.hostname.endsWith(".imdb.com"))) {
    throw new Error("Please enter a valid IMDb URL");
  }
  if (!/^\/title\/tt\d+/.test(url.pathname)) throw new Error("Please enter an IMDb title page");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ReelPick/1.0)",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("IMDb could not be reached. Try again in a moment.");

  const $ = cheerio.load(await response.text());
  let data: ImdbJson | undefined;
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const parsed = JSON.parse($(element).text()) as ImdbJson;
      if (parsed.name && parsed.image) data = parsed;
    } catch { /* Ignore unrelated malformed metadata. */ }
  });
  if (!data?.name || !data.image) throw new Error("Movie details were not found on that page");

  return {
    imdb_url: `${url.origin}${url.pathname}`,
    title: data.name,
    poster_url: data.image,
    categories: (Array.isArray(data.genre) ? data.genre : [data.genre]).filter(Boolean) as string[],
  };
}
