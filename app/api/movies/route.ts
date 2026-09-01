import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchOmdbMovie } from "@/lib/omdb";
import { saveMovie } from "@/lib/db";

const webUrl = z.string().url().refine(value => ["http:", "https:"].includes(new URL(value).protocol), "Watch URL must use HTTP or HTTPS");
const schema = z.object({ url: z.string().url(), sourceUrl: webUrl.optional() });

export async function POST(request: Request) {
  try {
    const { url, sourceUrl } = schema.parse(await request.json());
    return NextResponse.json({ movie: await saveMovie(await fetchOmdbMovie(url), sourceUrl) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add that movie";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
