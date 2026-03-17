// app/api/projects/[id]/duplicate/route.ts – Clone a project (settings only, no lyrics)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const src = await prisma.project.findUnique({ where: { id } });
  if (!src || src.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: `${src.name} (copy)`,
      sourceType: src.sourceType,
      audioOriginalKey: src.audioOriginalKey,
      audioMime: src.audioMime,
      youtubeUrl: src.youtubeUrl,
      genre: src.genre,
      vibe: src.vibe,
      language: src.language,
      bpm: src.bpm,
      durationSeconds: src.durationSeconds,
      topic: src.topic,
      isExplicit: src.isExplicit,
      rhyme: src.rhyme,
      inspoArtist: src.inspoArtist,
      inspoSong: src.inspoSong,
      keywords: src.keywords,
      status: "ready",
    },
  });

  return NextResponse.json({ id: copy.id });
}
