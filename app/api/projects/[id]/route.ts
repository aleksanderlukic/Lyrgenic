// app/api/projects/[id]/route.ts – Get single project (with latest lyrics version)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      lyricsVersions: {
        orderBy: { versionNumber: "desc" },
      },
    },
  });

  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(project);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.project.update({
    where: { id },
    data: {
      name: body.name,
      genre: body.genre,
      vibe: body.vibe,
      language: body.language,
      isExplicit: body.isExplicit,
      rhyme: body.rhyme,
      topic: body.topic,
      inspoArtist: body.inspoArtist,
      inspoSong: body.inspoSong,
      bpm: body.bpm,
    },
  });

  return NextResponse.json(updated);
}
