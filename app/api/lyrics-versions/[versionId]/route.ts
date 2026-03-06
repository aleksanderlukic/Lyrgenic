// app/api/lyrics-versions/[versionId]/route.ts – Delete a lyrics version
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { versionId } = await params;

  const version = await prisma.lyricsVersion.findUnique({
    where: { id: versionId },
    include: { project: { select: { userId: true } } },
  });

  if (!version)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (version.project.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.lyricsVersion.delete({ where: { id: versionId } });

  return NextResponse.json({ deleted: true });
}
