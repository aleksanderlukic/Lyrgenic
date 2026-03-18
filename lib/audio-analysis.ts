// lib/audio-analysis.ts – Audio analysis pipeline
// MVP: uses ffprobe for duration, heuristic for BPM, default section structuring.
// Architecture is designed so a real library can be dropped in later.

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);

export interface AudioSection {
  type: "intro" | "verse" | "chorus" | "bridge" | "outro" | "break";
  startSec: number;
  endSec: number;
  confidence: number;
}

export interface AudioAnalysis {
  bpm: number | null;
  durationSeconds: number;
  sections: AudioSection[];
  energySummary: string;
}

/**
 * Run ffprobe to get duration of an audio file.
 * Returns duration in seconds.
 */
async function probeDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  return parseFloat(stdout.trim());
}

/**
 * Generate a heuristic default song structure from duration.
 * Sections are proportional to total length.
 */
function buildDefaultSections(duration: number): AudioSection[] {
  const d = duration;
  if (d <= 60) {
    return [
      { type: "intro", startSec: 0, endSec: d * 0.1, confidence: 0.5 },
      { type: "verse", startSec: d * 0.1, endSec: d * 0.45, confidence: 0.5 },
      { type: "chorus", startSec: d * 0.45, endSec: d * 0.75, confidence: 0.5 },
      { type: "outro", startSec: d * 0.75, endSec: d, confidence: 0.5 },
    ];
  }
  return [
    { type: "intro", startSec: 0, endSec: d * 0.07, confidence: 0.6 },
    { type: "verse", startSec: d * 0.07, endSec: d * 0.27, confidence: 0.6 },
    { type: "chorus", startSec: d * 0.27, endSec: d * 0.42, confidence: 0.6 },
    { type: "verse", startSec: d * 0.42, endSec: d * 0.57, confidence: 0.6 },
    { type: "chorus", startSec: d * 0.57, endSec: d * 0.72, confidence: 0.6 },
    { type: "bridge", startSec: d * 0.72, endSec: d * 0.82, confidence: 0.4 },
    { type: "outro", startSec: d * 0.82, endSec: d, confidence: 0.6 },
  ];
}

/**
 * Analyse an audio file on disk.
 * `localPath` must be the path to the downloaded/temp audio file.
 * `userBpm` optionally lets user supply BPM when auto-detection is not available.
 */
export async function analyseAudio(
  localPath: string,
  userBpm?: number,
  fallbackDuration?: number,
): Promise<AudioAnalysis> {
  let durationSeconds = 0;

  try {
    durationSeconds = await probeDuration(localPath);
  } catch (err) {
    console.error("[analyseAudio] ffprobe failed:", err);
    if (fallbackDuration && fallbackDuration > 0) {
      // Use client-provided duration (read from browser Web Audio API)
      durationSeconds = fallbackDuration;
    } else {
      // Default to 180s (3:00) when no duration is available
      durationSeconds = 180;
    }
  }

  durationSeconds = Math.round(durationSeconds * 10) / 10;

  const sections = buildDefaultSections(durationSeconds);

  const bpm = userBpm ?? null;

  const energySummary = bpm
    ? `Estimated ${bpm} BPM, duration ${durationSeconds}s.`
    : `Duration: ${durationSeconds}s. BPM auto-detection not available.`;

  return { bpm, durationSeconds, sections, energySummary };
}
