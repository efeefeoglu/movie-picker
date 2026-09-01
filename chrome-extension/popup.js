const movieSection = document.querySelector("#movie");
const addButton = document.querySelector("#add");
const status = document.querySelector("#status");
const appUrl = "https://movie-picker-lyart.vercel.app";
let movie = null;

function showStatus(message = "", kind = "") {
  status.textContent = message;
  status.className = `status ${kind}`;
}

function readStreamingMovie() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
  const hostname = location.hostname.replace(/^www\./i, "").toLowerCase();
  const services = [
    { name: "MUBI", matches: (host) => host === "mubi.com" || host.endsWith(".mubi.com") },
    { name: "Prime Video", matches: (host) => host === "primevideo.com" || host.endsWith(".primevideo.com") || /(^|\.)amazon\.(com|ca|de|es|fr|in|it|co\.uk|co\.jp)$/.test(host) },
    { name: "Netflix", matches: (host) => host === "netflix.com" || host.endsWith(".netflix.com") },
    { name: "Max", matches: (host) => host === "max.com" || host.endsWith(".max.com") || host === "hbomax.com" || host.endsWith(".hbomax.com") },
  ];
  const service = services.find(({ matches }) => matches(hostname));
  if (!service) return { error: "Open a film page on MUBI, Prime Video, Netflix, or Max first." };

  const jsonLdItems = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap((node) => { try { const value = JSON.parse(node.textContent); return Array.isArray(value) ? value : [value]; } catch { return []; } })
    .flatMap((item) => item?.['@graph'] || [item]);
  const jsonLd = jsonLdItems.find((item) => {
    const types = Array.isArray(item?.['@type']) ? item['@type'] : [item?.['@type']];
    return types.some((type) => ["Movie", "TVMovie"].includes(type));
  });
  const heading = [...document.querySelectorAll("h1")].map((node) => node.textContent?.trim()).find(Boolean);
  const openGraphTitle = document.querySelector('meta[property="og:title"]')?.content?.trim();
  const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.content?.trim();
  const rawTitle = jsonLd?.name || heading || openGraphTitle || twitterTitle || document.title || "";
  const title = rawTitle
    .replace(/^Watch\s+/i, "")
    .replace(/^(?:Prime Video|MUBI|Max|HBO Max)\s*[-–—:]\s*/i, "")
    .replace(/\s+(?:19|20)\d{2}\s+on\s+(?:MUBI|Prime Video|Netflix|Max|HBO Max).*$/i, "")
    .replace(/\s+on\s+(?:MUBI|Prime Video|Netflix|Max|HBO Max).*$/i, "")
    .replace(/\s*[|•·–—-]\s*(?:MUBI|Prime Video|Netflix|Max|HBO Max).*$/i, "")
    .replace(/^Netflix\s*[-–—:]\s*/i, "")
    .trim();
  const date = jsonLd?.dateCreated || jsonLd?.datePublished || document.querySelector('meta[property="video:release_date"]')?.content || document.querySelector('meta[itemprop="dateCreated"]')?.content || "";
  const year = String(date).match(/(?:19|20)\d{2}/)?.[0] || rawTitle.match(/\b(?:19|20)\d{2}\b/)?.[0] || document.body.innerText.match(/\b(?:19|20)\d{2}\b/)?.[0] || "";
  return title ? { title, year, sourceUrl: canonical, service: service.name } : { error: `Could not read the title from this ${service.name} page.` };
}

async function addMovie() {
  addButton.disabled = true;
  showStatus("Searching IMDb…", "loading");
  try {
    const response = await fetch(`${appUrl}/api/movies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: movie.title, year: movie.year || undefined, sourceUrl: movie.sourceUrl }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "ReelPick could not add this film.");
    status.className = "status success";
    status.replaceChildren(document.createTextNode(`✓ ${data.movie?.title || movie.title} was added. `));
    const link = document.createElement("a");
    link.href = appUrl; link.target = "_blank"; link.textContent = "Open ReelPick";
    status.append(link);
  } catch (error) { showStatus(error.message || "Something went wrong.", "error"); }
  finally { addButton.disabled = false; }
}

async function init() {
  showStatus("Reading this page…", "loading");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return showStatus("Could not access the current tab.", "error");
  const supportedUrl = /^https:\/\/(?:[^/]+\.)?(?:mubi\.com|primevideo\.com|netflix\.com|max\.com|hbomax\.com|amazon\.(?:com|ca|de|es|fr|in|it|co\.uk|co\.jp))(?:\/|$)/i;
  if (!supportedUrl.test(tab.url || "")) return showStatus("Open a film page on MUBI, Prime Video, Netflix, or Max first.", "error");

  const injection = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readStreamingMovie });
  const result = injection[0]?.result;
  if (!result) showStatus("Chrome could not read this page. Reload the tab and try again.", "error");
  else if (result.error) showStatus(result.error, "error");
  else {
    movie = result;
    showStatus();
    document.querySelector("#source").textContent = `FILM FOUND ON ${movie.service.toUpperCase()}`;
    document.querySelector("#title").textContent = movie.title;
    document.querySelector("#year").textContent = movie.year || "Year not detected";
  }
  movieSection.hidden = !movie;
}

addButton.addEventListener("click", addMovie);
init().catch((error) => showStatus(error.message || "The extension could not start.", "error"));
