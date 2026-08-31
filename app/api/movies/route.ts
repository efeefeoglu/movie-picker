import { NextResponse } from "next/server";
import { z } from "zod";
import { scrapeImdb } from "@/lib/imdb";
import { saveMovie } from "@/lib/db";

const schema = z.object({ url: z.string().url() });

export async function POST(request: Request) {
  try {
    const { url } = schema.parse(await request.json());
    return NextResponse.json({ movie: await saveMovie(await scrapeImdb(url)) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add that movie";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
