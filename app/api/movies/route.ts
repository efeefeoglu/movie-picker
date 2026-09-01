import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchOmdbMovie, findOmdbMovie } from "@/lib/omdb";
import { saveMovie } from "@/lib/db";

const webUrl = z.string().url().refine(value => ["http:", "https:"].includes(new URL(value).protocol), "Watch URL must use HTTP or HTTPS");
const schema = z.union([
  z.object({ url: z.string().url(), sourceUrl: webUrl.optional() }),
  z.object({ title: z.string().trim().min(1), year: z.string().regex(/^(?:19|20)\d{2}$/).optional(), sourceUrl: webUrl.optional() }),
]);

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const movie = "url" in input
      ? await fetchOmdbMovie(input.url)
      : await findOmdbMovie(input.title, input.year);
    return NextResponse.json({ movie: await saveMovie(movie, input.sourceUrl) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add that movie";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
