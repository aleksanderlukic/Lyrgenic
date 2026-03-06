// app/api/projects/[id]/regen-section/route.ts – Regenerate a single section
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLyrics, LyricsOutput } from "@/lib/openai";
import { z } from "zod";

const Schema = z.object({
  sectionName: z.string().min(1),
  versionId: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        lyricsVersions: { orderBy: { versionNumber: "desc" } },
      },
    });
    if (!project)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (project.userId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { sectionName, versionId } = Schema.parse(body);

    // Use the requested version if provided, otherwise fall back to latest
    const base = versionId
      ? project.lyricsVersions.find((v) => v.id === versionId)
      : project.lyricsVersions[0];

    if (!base)
      return NextResponse.json(
        { error: "No lyrics version found" },
        { status: 409 },
      );

    const analysis = project.analysisJson as any;
    const existingContext = JSON.stringify(base.lyricsJson);

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
    const existingLyricsObj = base.lyricsJson as any;
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
        title: base.title,
        songBrief: base.songBrief,
        structureJson: (base.structureJson ?? undefined) as any,
        lyricsJson: {
          title: base.title ?? "",
          songBrief: base.songBrief ?? "",
          lyrics: mergedLyrics,
          performanceNotes: base.performanceNotes ?? "",
        } as any,
        performanceNotes: base.performanceNotes ?? "",
      },
    });

    await prisma.generationLog.create({
      data: { userId, projectId: id, type: "section_regen", tokens, costUsd },
    });

    return NextResponse.json({ version: newVersion });
  } catch (err: unknown) {
    console.error("[regen-section]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
