// app/api/projects/[id]/audio-url/route.ts – Return presigned download URL for audio
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/lib/s3";

export async function GET(
  _req: Request,
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

  if (!project.audioOriginalKey) {
    return NextResponse.json(
      { error: "No audio file attached" },
      { status: 404 },
    );
  }

  const url = await getPresignedDownloadUrl(project.audioOriginalKey, 3600);
  return NextResponse.json({ url });
}
