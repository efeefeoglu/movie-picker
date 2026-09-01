const movieSection = document.querySelector("#movie");
const addButton = document.querySelector("#add");
const status = document.querySelector("#status");
const appUrl = "https://movie-picker-lyart.vercel.app";
let movie = null;

function showStatus(message = "", kind = "") {
  status.textContent = message;
  status.className = `status ${kind}`;
}

function readMubiMovie() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
  if (!/(^|\.)mubi\.com$/i.test(location.hostname)) return { error: "Open a film page on MUBI first." };

  const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap((node) => { try { const value = JSON.parse(node.textContent); return Array.isArray(value) ? value : [value]; } catch { return []; } })
    .find((item) => item?.['@type'] === 'Movie');
  const heading = document.querySelector("h1")?.textContent?.trim();
  const openGraphTitle = document.querySelector('meta[property="og:title"]')?.content?.trim();
  const rawTitle = heading || jsonLd?.name || openGraphTitle || document.title;
  const title = rawTitle
    .replace(/^Watch\s+/i, "")
    .replace(/\s+(?:19|20)\d{2}\s+on\s+MUBI.*$/i, "")
    .replace(/\s+on\s+MUBI.*$/i, "")
    .replace(/\s*[|–—-]\s*MUBI.*$/i, "")
    .trim();
  const date = jsonLd?.dateCreated || jsonLd?.datePublished || document.querySelector('meta[property="video:release_date"]')?.content || "";
  const year = String(date).match(/(?:19|20)\d{2}/)?.[0] || rawTitle.match(/\b(?:19|20)\d{2}\b/)?.[0] || document.body.innerText.match(/\b(?:19|20)\d{2}\b/)?.[0] || "";
  return title ? { title, year, sourceUrl: canonical } : { error: "Could not read the title from this MUBI page." };
}

async function findImdbMatch({ title, year }) {
  const key = title.trim()[0]?.toLowerCase() || "x";
  const query = encodeURIComponent(`${title}${year ? ` ${year}` : ""}`);
  const response = await fetch(`https://v2.sg.media-imdb.com/suggestion/${encodeURIComponent(key)}/${query}.json`);
  if (!response.ok) throw new Error("IMDb search is unavailable right now.");
  const { d = [] } = await response.json();
  const movies = d.filter((item) => /^tt\d+$/.test(item.id) && ["feature", "movie", "tvMovie", "short"].includes(item.qid));
  const exactYear = year && movies.find((item) => String(item.y) === year);
  const match = exactYear || movies[0];
  if (!match) throw new Error(`No IMDb movie result was found for “${title}”.`);
  return { url: `https://www.imdb.com/title/${match.id}/`, title: match.l || title, year: match.y };
}

async function addMovie() {
  addButton.disabled = true;
  showStatus("Searching IMDb…", "loading");
  try {
    const imdb = await findImdbMatch(movie);
    showStatus(`Found ${imdb.title}${imdb.year ? ` (${imdb.year})` : ""}. Adding to ReelPick…`, "loading");
    const response = await fetch(`${appUrl}/api/movies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: imdb.url, sourceUrl: movie.sourceUrl }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "ReelPick could not add this film.");
    status.className = "status success";
    status.replaceChildren(document.createTextNode(`✓ ${data.movie?.title || imdb.title} was added. `));
    const link = document.createElement("a");
    link.href = appUrl; link.target = "_blank"; link.textContent = "Open ReelPick";
    status.append(link);
  } catch (error) { showStatus(error.message || "Something went wrong.", "error"); }
  finally { addButton.disabled = false; }
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return showStatus("Could not access the current tab.", "error");
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readMubiMovie });
  if (result.error) showStatus(result.error, "error");
  else {
    movie = result;
    document.querySelector("#title").textContent = movie.title;
    document.querySelector("#year").textContent = movie.year || "Year not detected";
  }
  movieSection.hidden = !movie;
}

addButton.addEventListener("click", addMovie);
init().catch((error) => showStatus(error.message || "The extension could not start.", "error"));
