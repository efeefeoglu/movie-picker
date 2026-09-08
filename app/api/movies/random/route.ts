import { NextResponse } from "next/server";
import { getRandomMovies } from "@/lib/db";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");
  const includeSecondary = new URL(request.url).searchParams.get("secondary") === "true";
  if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 });
  return NextResponse.json({ movies: await getRandomMovies(category, includeSecondary) });
}
