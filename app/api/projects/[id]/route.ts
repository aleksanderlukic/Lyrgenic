// app/api/projects/[id]/route.ts – Get single project (with latest lyrics version)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectWithAccess } from "@/lib/project-access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await getProjectWithAccess(id, session.user.id);
  if (!access)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { project } = access;

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
  const access = await getProjectWithAccess(id, session.user.id);
  if (!access)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Only owner can change project settings
  if (!access.isOwner)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { project } = access;

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
      keywords: body.keywords,
      bpm: body.bpm,
      ...(body.durationSeconds !== undefined && {
        durationSeconds: body.durationSeconds,
      }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
