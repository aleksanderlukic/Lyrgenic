// lib/openai.ts – OpenAI/Groq completion helper + structured lyrics generator
import { z } from "zod";

// Use Groq if GROQ_API_KEY is set, otherwise OpenAI
const isGroq = !!process.env.GROQ_API_KEY;
const API_URL = isGroq
  ? "https://api.groq.com/openai/v1/chat/completions"
  : "https://api.openai.com/v1/chat/completions";
const API_KEY = isGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o";

/** Shared fetch wrapper for OpenAI-compatible chat completions */
async function chatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options?: { temperature?: number; max_tokens?: number },
) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.max_tokens ?? 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return {
    content: data.choices[0].message.content as string,
    usage: data.usage,
  };
}

// ─── Zod schemas ─────────────────────────────────────────────────────

export const StructureItemSchema = z.object({
  name: z.string(),
  startSec: z.number(),
  endSec: z.number(),
});

export const LyricLineSchema = z.object({
  timeSec: z.number(),
  text: z.string(),
});

export const LyricsSectionSchema = z.object({
  section: z.string(),
  lines: z.array(LyricLineSchema),
});

export const LyricsOutputSchema = z.object({
  title: z.string(),
  songBrief: z.string(),
  structure: z.array(StructureItemSchema),
  lyrics: z.array(LyricsSectionSchema),
  performanceNotes: z.string().optional(),
});

export type LyricsOutput = z.infer<typeof LyricsOutputSchema>;

// ─── System prompt ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert professional songwriter and topliner assistant.
Rules:
1. Write ORIGINAL lyrics only. Do NOT copy or paraphrase existing songs.
2. When user provides an inspiration artist, treat it as a style reference (genre, energy, tone) ONLY. Never mimic their identity, catchphrases, or specific lyrics.
3. Always return valid JSON matching the schema exactly.
4. Timestamps must be consistent with the audio structure provided.

Output schema:
{
  "title": "string",
  "songBrief": "string",
  "structure": [{ "name": "string", "startSec": number, "endSec": number }],
  "lyrics": [{ "section": "string", "lines": [{ "timeSec": number, "text": "string" }] }],
  "performanceNotes": "string"
}`;

// ─── Main generator ──────────────────────────────────────────────────

export interface GenerateLyricsParams {
  bpm?: number;
  durationSeconds?: number;
  sections?: { type: string; startSec: number; endSec: number }[];
  genre?: string;
  vibe?: string;
  language?: string;
  isExplicit?: boolean;
  topic?: string;
  inspoArtist?: string;
  inspoSong?: string;
  existingContext?: string; // for section regen
  targetSection?: string; // for section regen
}

export async function generateLyrics(params: GenerateLyricsParams): Promise<{
  output: LyricsOutput;
  tokens: number;
  costUsd: number;
}> {
  const sectionsList = params.sections
    ?.map((s) => `  ${s.type}: ${s.startSec}s – ${s.endSec}s`)
    .join("\n");

  const userPrompt = `
Beat analysis:
- BPM: ${params.bpm ?? "unknown"}
- Duration: ${params.durationSeconds ? `${params.durationSeconds.toFixed(1)}s` : "unknown"}
- Sections:
${sectionsList ?? "  (use default structure)"}

Song preferences:
- Genre: ${params.genre ?? "any"}
- Vibe/Mood: ${params.vibe ?? "any"}
- Language: ${params.language ?? "English"}
- Clean/Explicit: ${params.isExplicit ? "Explicit allowed" : "Keep it clean"}
- Topic/Story: ${params.topic ?? "freestyle – you decide"}
${params.inspoArtist ? `- Inspiration artist: ${params.inspoArtist} (style reference only)` : ""}
${params.inspoSong ? `- Inspiration song: ${params.inspoSong} (style reference only)` : ""}
${params.targetSection ? `\nREGENERATE ONLY the "${params.targetSection}" section. Keep all other sections unchanged. Existing context:\n${params.existingContext}` : ""}

Return ONLY valid JSON matching the schema.`;

  let raw: string;
  let usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };

  try {
    const result = await chatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.85, max_tokens: 3500 },
    );
    raw = result.content;
    usage = result.usage;
  } catch (e) {
    throw e;
  }

  // Parse + validate
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Ask for repair
    const repairResult = await chatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
      { role: "assistant", content: raw },
      {
        role: "user",
        content:
          "Your previous response was not valid JSON. Return ONLY valid JSON, nothing else.",
      },
    ]);
    parsed = JSON.parse(repairResult.content);
    usage.total_tokens += repairResult.usage.total_tokens;
  }

  const output = LyricsOutputSchema.parse(parsed);
  // Approximate cost: $0.01 / 1000 tokens for GPT-4o
  const costUsd = (usage.total_tokens / 1000) * 0.01;

  return { output, tokens: usage.total_tokens, costUsd };
}
