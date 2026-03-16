// app/api/projects/[id]/regen-line/route.ts – Regenerate a single lyrics line
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { regenerateLine } from "@/lib/openai";
import { z } from "zod";

const Schema = z.object({
  versionId: z.string(),
  sectionName: z.string().min(1),
  lineIndex: z.number().int().min(0),
});

export async function POST(
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
  const { versionId, sectionName, lineIndex } = Schema.parse(body);

  const version = await prisma.lyricsVersion.findUnique({
    where: { id: versionId },
  });
  if (!version || version.projectId !== id)
    return NextResponse.json({ error: "Version not found" }, { status: 404 });

  const lyricsJson = version.lyricsJson as any;
  const section = (lyricsJson?.lyrics ?? []).find(
    (s: any) => s.section === sectionName,
  );
  if (!section)
    return NextResponse.json({ error: "Section not found" }, { status: 404 });

  const lines: { timeSec: number; text: string }[] = section.lines ?? [];
  const currentLine = lines[lineIndex]?.text ?? "";
  const linesBefore = lines.slice(0, lineIndex).map((l) => l.text);
  const linesAfter = lines.slice(lineIndex + 1).map((l) => l.text);

  const p = project as any;
  const newText = await regenerateLine({
    genre: p.genre ?? undefined,
    vibe: p.vibe ?? undefined,
    language: p.language,
    isExplicit: p.isExplicit,
    rhyme: p.rhyme,
    sectionName,
    linesBefore,
    linesAfter,
    currentLine,
  });

  return NextResponse.json({ lines: newText });
}
