// app/api/projects/[id]/regen-section/route.ts – Regenerate a single section
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLyrics, LyricsOutput } from "@/lib/openai";
import { z } from "zod";

const Schema = z.object({ sectionName: z.string().min(1) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      lyricsVersions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.userId !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { sectionName } = Schema.parse(body);

  const latest = project.lyricsVersions[0];
  if (!latest)
    return NextResponse.json(
      { error: "No lyrics version found" },
      { status: 409 },
    );

  const analysis = project.analysisJson as any;
  const existingContext = JSON.stringify(latest.lyricsJson);

  const { output, tokens, costUsd } = await generateLyrics({
    bpm: analysis?.bpm ?? project.bpm ?? undefined,
    durationSeconds:
      analysis?.durationSeconds ?? project.durationSeconds ?? undefined,
    sections: analysis?.sections,
    genre: project.genre ?? undefined,
    vibe: project.vibe ?? undefined,
    language: project.language,
    isExplicit: project.isExplicit,
    topic: project.topic ?? undefined,
    inspoArtist: project.inspoArtist ?? undefined,
    inspoSong: project.inspoSong ?? undefined,
    existingContext,
    targetSection: sectionName,
  });

  // Merge new section into existing lyrics
  const existingLyricsObj = latest.lyricsJson as any;
  const existingLyricsArr: LyricsOutput["lyrics"] = Array.isArray(existingLyricsObj)
    ? existingLyricsObj
    : existingLyricsObj?.lyrics ?? [];
  const newSection = output.lyrics.find((s) => s.section === sectionName);
  const mergedLyrics = existingLyricsArr.map((s) =>
    s.section === sectionName && newSection ? newSection : s,
  );

  const versionCount = await prisma.lyricsVersion.count({
    where: { projectId: id },
  });

  const newVersion = await prisma.lyricsVersion.create({
    data: {
      projectId: id,
      versionNumber: versionCount + 1,
      source: "llm",
      title: latest.title,
      songBrief: latest.songBrief,
      structureJson: (latest.structureJson ?? undefined) as any,
      lyricsJson: {
        title: latest.title ?? "",
        songBrief: latest.songBrief ?? "",
        lyrics: mergedLyrics,
        performanceNotes: latest.performanceNotes ?? "",
      } as any,
      performanceNotes: latest.performanceNotes ?? "",
    },
  });

  await prisma.generationLog.create({
    data: { userId, projectId: id, type: "section_regen", tokens, costUsd },
  });

  return NextResponse.json({ version: newVersion });
}
