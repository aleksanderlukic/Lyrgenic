// scripts/worker.ts – BullMQ worker process (run in production separately)
// Usage: npx tsx scripts/worker.ts

import { Worker } from "bullmq";
import { runAnalysis } from "../lib/jobs/analysis-job";
import { runGeneration } from "../lib/jobs/generation-job";

if (!process.env.REDIS_URL) {
  console.error("REDIS_URL is required for the worker process");
  process.exit(1);
}

// Pass connection string directly so BullMQ uses its own bundled ioredis,
// avoiding the version mismatch with the standalone ioredis package.
const connection = { url: process.env.REDIS_URL };

const analysisWorker = new Worker(
  "analysis",
  async (job) => {
    console.log(`[worker] Processing analysis job ${job.id}`);
    await runAnalysis(job.data);
  },
  { connection, concurrency: 2 },
);

const generationWorker = new Worker(
  "generation",
  async (job) => {
    console.log(`[worker] Processing generation job ${job.id}`);
    await runGeneration(job.data);
  },
  { connection, concurrency: 2 },
);

analysisWorker.on("failed", (job, err) =>
  console.error(`[worker] Analysis job ${job?.id} failed:`, err),
);
generationWorker.on("failed", (job, err) =>
  console.error(`[worker] Generation job ${job?.id} failed:`, err),
);

console.log("[worker] Analysis + Generation workers started");
