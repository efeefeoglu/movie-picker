import { NextResponse } from "next/server";
import { z } from "zod";
import { updateMovieStatus } from "@/lib/db";

const schema = z.object({ status: z.enum(["new", "watched", "alone"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { status } = schema.parse(await request.json());
    const movie = await updateMovieStatus((await params).id, status);
    return movie ? NextResponse.json({ movie }) : NextResponse.json({ error: "Movie not found" }, { status: 404 });
  } catch { return NextResponse.json({ error: "Invalid status" }, { status: 400 }); }
}
