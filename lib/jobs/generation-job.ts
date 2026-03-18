// lib/jobs/generation-job.ts – Lyrics generation job handler
import { prisma } from "../prisma";
import { generateLyrics } from "../openai";

export async function runGeneration(data: {
  projectId: string;
  userId: string;
}) {
  const { projectId, userId } = data;

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "generating" },
  });

  try {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });
    const analysis = project.analysisJson as any;

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
      keywords: project.keywords ?? undefined,
      rhyme: project.rhyme,
    });

    // Clamp every line timestamp to [0, durationSeconds] so lyrics never
    // exceed the actual beat length or start before it.
    const maxSec =
      (analysis?.durationSeconds as number | null | undefined) ??
      project.durationSeconds ??
      null;
    if (maxSec && maxSec > 0) {
      output.lyrics = output.lyrics.map((section) => ({
        ...section,
        lines: section.lines.map((line) => ({
          ...line,
          timeSec: Math.min(Math.max(0, line.timeSec), maxSec),
        })),
      }));
      // Also clamp structure entries
      output.structure = output.structure.map((s) => ({
        ...s,
        startSec: Math.min(Math.max(0, s.startSec), maxSec),
        endSec: Math.min(Math.max(0, s.endSec), maxSec),
      }));
    }

    // Find next version number
    const versionCount = await prisma.lyricsVersion.count({
      where: { projectId },
    });

    await prisma.lyricsVersion.create({
      data: {
        projectId,
        versionNumber: versionCount + 1,
        source: "llm",
        title: output.title,
        songBrief: output.songBrief,
        structureJson: output.structure as any,
        lyricsJson: {
          title: output.title,
          songBrief: output.songBrief,
          lyrics: output.lyrics,
          performanceNotes: output.performanceNotes ?? "",
        } as any,
        performanceNotes: output.performanceNotes ?? "",
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "done" },
    });

    await prisma.generationLog.create({
      data: {
        userId,
        projectId,
        type: "lyrics",
        tokens,
        costUsd,
      },
    });
  } catch (err) {
    console.error("[generation-job] Error:", err);
    // Reset to "ready" so the user can retry (e.g. after adding an API key)
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ready" },
    });
  }
}
