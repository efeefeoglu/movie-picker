const setup = document.querySelector("#setup");
const movieSection = document.querySelector("#movie");
const appUrlInput = document.querySelector("#app-url");
const saveUrlButton = document.querySelector("#save-url");
const addButton = document.querySelector("#add");
const settingsButton = document.querySelector("#settings");
const status = document.querySelector("#status");
let appUrl = "";
let movie = null;

function showStatus(message = "", kind = "") {
  status.textContent = message;
  status.className = `status ${kind}`;
}

function normalizeAppUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Use an http or https URL.");
  return url.origin + url.pathname.replace(/\/$/, "");
}

function readMubiMovie() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
  if (!/(^|\.)mubi\.com$/i.test(location.hostname)) return { error: "Open a film page on MUBI first." };

  const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap((node) => { try { const value = JSON.parse(node.textContent); return Array.isArray(value) ? value : [value]; } catch { return []; } })
    .find((item) => item?.['@type'] === 'Movie');
  const rawTitle = jsonLd?.name || document.querySelector('meta[property="og:title"]')?.content || document.title;
  const title = rawTitle.replace(/\s*[|–—-]\s*MUBI.*$/i, "").trim();
  const date = jsonLd?.dateCreated || jsonLd?.datePublished || document.querySelector('meta[property="video:release_date"]')?.content || "";
  const year = String(date).match(/(?:19|20)\d{2}/)?.[0] || document.body.innerText.match(/\b(?:19|20)\d{2}\b/)?.[0] || "";
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

async function saveAppUrl() {
  try {
    appUrl = normalizeAppUrl(appUrlInput.value.trim());
    await chrome.storage.sync.set({ appUrl });
    setup.hidden = true;
    movieSection.hidden = !movie;
    settingsButton.hidden = false;
    showStatus();
  } catch (error) { showStatus(error.message || "Enter a valid web app URL.", "error"); }
}

async function addMovie() {
  addButton.disabled = true;
  showStatus("Searching IMDb…", "loading");
  try {
    const imdb = await findImdbMatch(movie);
    showStatus(`Found ${imdb.title}${imdb.year ? ` (${imdb.year})` : ""}. Adding to ReelPick…`, "loading");
    const response = await fetch(`${appUrl}/api/movies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: imdb.url }) });
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
  ({ appUrl = "" } = await chrome.storage.sync.get("appUrl"));
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return showStatus("Could not access the current tab.", "error");
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readMubiMovie });
  if (result.error) showStatus(result.error, "error");
  else {
    movie = result;
    document.querySelector("#title").textContent = movie.title;
    document.querySelector("#year").textContent = movie.year || "Year not detected";
  }
  setup.hidden = Boolean(appUrl);
  movieSection.hidden = !appUrl || !movie;
  settingsButton.hidden = !appUrl;
  appUrlInput.value = appUrl;
}

saveUrlButton.addEventListener("click", saveAppUrl);
appUrlInput.addEventListener("keydown", (event) => { if (event.key === "Enter") saveAppUrl(); });
addButton.addEventListener("click", addMovie);
settingsButton.addEventListener("click", () => { setup.hidden = false; movieSection.hidden = true; settingsButton.hidden = true; appUrlInput.focus(); });
init().catch((error) => showStatus(error.message || "The extension could not start.", "error"));
