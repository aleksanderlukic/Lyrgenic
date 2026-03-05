// app/api/projects/[id]/preview/route.ts – Optional TTS preview (feature flag)
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

  if (process.env.FEATURE_PREVIEW_VOICE !== "true") {
    return NextResponse.json(
      { error: "Preview voice feature is not enabled" },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.plan !== "creator") {
    return NextResponse.json(
      { error: "Preview voice requires the Creator plan" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      lyricsVersions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lyrics = project.lyricsVersions[0];
  if (!lyrics)
    return NextResponse.json(
      { error: "No lyrics version found" },
      { status: 409 },
    );

  // NOTE: Full TTS + mix implementation would:
  // 1. Flatten lyrics lines → timed script
  // 2. Call a TTS API (generic voice only, no celebrity cloning)
  // 3. Use ffmpeg to overlay speech on beat at low volume
  // 4. Upload to S3, return URL
  // This is a placeholder that returns an info message.
  return NextResponse.json({
    message:
      "Preview voice processing is queued (robot voice only – NOT an artist impersonation).",
    projectId: id,
    versionId: lyrics.id,
  });
}
