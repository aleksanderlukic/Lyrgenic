// app/api/projects/route.ts – List + Create projects
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  sourceType: z.enum(["upload", "youtube"]),
  youtubeUrl: z.string().url().optional().nullable(),
  audioOriginalKey: z.string().optional().nullable(),
  audioMime: z.string().optional().nullable(),
  genre: z.string().optional(),
  vibe: z.string().optional(),
  language: z.string().default("English"),
  isExplicit: z.boolean().default(false),
  rhyme: z.boolean().default(false),
  topic: z.string().max(1000).optional(),
  inspoArtist: z.string().max(100).optional(),
  inspoSong: z.string().max(200).optional(),
  keywords: z.string().max(500).optional(),
  bpm: z.number().min(20).max(400).optional(),
});

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      sourceType: true,
      genre: true,
      vibe: true,
      language: true,
      status: true,
      durationSeconds: true,
      bpm: true,
      createdAt: true,
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = CreateSchema.safeParse(body);
  if (!result.success)
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 422 },
    );

  // Validate source
  const { sourceType, youtubeUrl, audioOriginalKey } = result.data;
  if (sourceType === "upload" && !audioOriginalKey) {
    return NextResponse.json(
      { error: "audioOriginalKey is required for upload projects" },
      { status: 422 },
    );
  }
  if (sourceType === "youtube") {
    if (
      !process.env.YOUTUBE_INGEST_ENABLED ||
      process.env.YOUTUBE_INGEST_ENABLED === "false"
    ) {
      // Accept URL for future processing but do not process now
      if (!youtubeUrl) {
        return NextResponse.json(
          { error: "youtubeUrl is required for youtube source" },
          { status: 422 },
        );
      }
    }
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: result.data.name,
      sourceType: result.data.sourceType,
      youtubeUrl: result.data.youtubeUrl ?? null,
      audioOriginalKey: result.data.audioOriginalKey ?? null,
      audioMime: result.data.audioMime ?? null,
      genre: result.data.genre,
      vibe: result.data.vibe,
      language: result.data.language,
      isExplicit: result.data.isExplicit,
      rhyme: result.data.rhyme,
      topic: result.data.topic,
      inspoArtist: result.data.inspoArtist,
      inspoSong: result.data.inspoSong,
      keywords: result.data.keywords,
      bpm: result.data.bpm,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
