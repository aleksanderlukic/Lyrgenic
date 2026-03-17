// app/api/share/[token]/route.ts – Public read-only endpoint (no auth required)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const project = await (prisma.project as any).findUnique({
    where: { shareToken: token },
    include: {
      lyricsVersions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return only safe public fields
  return NextResponse.json({
    name: project.name,
    genre: project.genre,
    vibe: project.vibe,
    language: project.language,
    bpm: project.bpm,
    durationSeconds: project.durationSeconds,
    latestVersion: project.lyricsVersions[0] ?? null,
  });
}
