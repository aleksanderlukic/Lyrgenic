// lib/queues.ts – BullMQ queues (analysis, generation, preview)
// Workers run in scripts/worker.ts for production, or in-process in dev.
import { Queue, Worker, type Job } from "bullmq";
import { redis } from "./redis";

// ─── Queue definitions ────────────────────────────────────────────────

const defaultConn = redis
  ? { host: redis.options.host, port: redis.options.port }
  : undefined;

function makeQueue<T>(name: string) {
  if (!redis) return null;
  return new Queue<T>(name, { connection: defaultConn as any });
}

export const analysisQueue = makeQueue<{ projectId: string; userId: string }>(
  "analysis",
);
export const generationQueue = makeQueue<{ projectId: string; userId: string }>(
  "generation",
);
export const previewQueue = makeQueue<{
  projectId: string;
  lyricsVersionId: string;
}>("preview");

// ─── In-process fallback (when Redis is unavailable) ─────────────────

import { runAnalysis } from "./jobs/analysis-job";
import { runGeneration } from "./jobs/generation-job";

export async function enqueueAnalysis(projectId: string, userId: string) {
  if (analysisQueue) {
    await analysisQueue.add("analyse", { projectId, userId });
  } else {
    // Run synchronously in-process (no Redis)
    await runAnalysis({ projectId, userId });
  }
}

export async function enqueueGeneration(projectId: string, userId: string) {
  if (generationQueue) {
    await generationQueue.add("generate", { projectId, userId });
  } else {
    // Run synchronously in-process (no Redis)
    await runGeneration({ projectId, userId });
  }
}
