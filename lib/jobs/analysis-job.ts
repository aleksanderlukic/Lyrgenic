// lib/jobs/analysis-job.ts – Analysis job handler
import { prisma } from "../prisma";
import { analyseAudio } from "../audio-analysis";
import { s3, BUCKET } from "../s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { Readable } from "stream";

export async function runAnalysis(data: { projectId: string; userId: string }) {
  const { projectId } = data;

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "analyzing" },
  });

  try {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    let localPath: string | null = null;
    const tmpDir = os.tmpdir();

    if (project.audioOriginalKey) {
      // Download from S3 to temp file
      const cmd = new GetObjectCommand({
        Bucket: BUCKET,
        Key: project.audioOriginalKey,
      });
      const body = (await s3.send(cmd)).Body;
      if (!body) throw new Error("S3 object has no body");

      const ext = path.extname(project.audioOriginalKey) || ".mp3";
      localPath = path.join(tmpDir, `lyrgenic-${projectId}${ext}`);
      const fileStream = await fs.open(localPath, "w");
      const writer = fileStream.createWriteStream();
      await new Promise<void>((res, rej) =>
        (body as Readable).pipe(writer).on("finish", res).on("error", rej),
      );
    }

    if (!localPath) {
      // YouTube or no audio: use duration from project if set, or default 180s
      const duration = project.durationSeconds ?? 180;
      const analysisJson = {
        bpm: project.bpm ?? null,
        durationSeconds: duration,
        sections: buildDefaultSectionsRaw(duration),
        energySummary: "No audio file – using placeholder analysis.",
      };
      await prisma.project.update({
        where: { id: projectId },
        data: { analysisJson, status: "ready" },
      });
      return;
    }

    const analysis = await analyseAudio(localPath, project.bpm ?? undefined);

    await prisma.project.update({
      where: { id: projectId },
      data: {
        analysisJson: analysis as any,
        durationSeconds: analysis.durationSeconds,
        bpm: analysis.bpm ?? undefined,
        status: "ready",
      },
    });

    // Clean up temp file
    await fs.unlink(localPath).catch(() => {});
  } catch (err) {
    console.error("[analysis-job] Error:", err);
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "error" },
    });
  }
}

function buildDefaultSectionsRaw(d: number) {
  return [
    { type: "intro", startSec: 0, endSec: +(d * 0.07).toFixed(1) },
    {
      type: "verse",
      startSec: +(d * 0.07).toFixed(1),
      endSec: +(d * 0.27).toFixed(1),
    },
    {
      type: "chorus",
      startSec: +(d * 0.27).toFixed(1),
      endSec: +(d * 0.42).toFixed(1),
    },
    {
      type: "verse",
      startSec: +(d * 0.42).toFixed(1),
      endSec: +(d * 0.57).toFixed(1),
    },
    {
      type: "chorus",
      startSec: +(d * 0.57).toFixed(1),
      endSec: +(d * 0.72).toFixed(1),
    },
    {
      type: "bridge",
      startSec: +(d * 0.72).toFixed(1),
      endSec: +(d * 0.82).toFixed(1),
    },
    { type: "outro", startSec: +(d * 0.82).toFixed(1), endSec: d },
  ];
}
