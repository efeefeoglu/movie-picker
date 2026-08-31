import { NextResponse } from "next/server";

type YouTubeSearchResponse = {
  items?: { id?: { videoId?: string } }[];
  error?: { message?: string };
};

export async function GET(request: Request) {
  const title = new URL(request.url).searchParams.get("title")?.trim();
  if (!title) return NextResponse.json({ error: "Movie title is required" }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "YouTube search is not configured" }, { status: 503 });

  const params = new URLSearchParams({
    part: "snippet", q: `${title} official trailer`, type: "video",
    videoEmbeddable: "true", maxResults: "1", key: apiKey,
  });

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { cache: "no-store" });
    const result = await response.json() as YouTubeSearchResponse;
    if (!response.ok) return NextResponse.json({ error: result.error?.message ?? "YouTube search failed" }, { status: 502 });

    const videoId = result.items?.[0]?.id?.videoId;
    return videoId
      ? NextResponse.json({ videoId })
      : NextResponse.json({ error: "No trailer found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Could not reach YouTube" }, { status: 502 });
  }
}
