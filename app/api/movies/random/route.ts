import { NextResponse } from "next/server";
import { getRandomMovie, getRandomMovies } from "@/lib/db";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");
  const includeSecondary = new URL(request.url).searchParams.get("secondary") === "true";
  if (!category) return NextResponse.json({ movie: await getRandomMovie() ?? null });
  return NextResponse.json({ movies: await getRandomMovies(category, includeSecondary) });
}
