// app/api/projects/[id]/save-version/route.ts – Save user-edited version
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LyricsOutputSchema } from "@/lib/openai";
import { z } from "zod";

const Schema = z.object({
  title: z.string(),
  songBrief: z.string(),
  structureJson: z.array(z.any()),
  lyricsJson: z.array(z.any()),
  performanceNotes: z.string().optional(),
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
  const result = Schema.safeParse(body);
  if (!result.success)
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 422 },
    );

  const versionCount = await prisma.lyricsVersion.count({
    where: { projectId: id },
  });

  const version = await prisma.lyricsVersion.create({
    data: {
      projectId: id,
      versionNumber: versionCount + 1,
      source: "user",
      title: result.data.title,
      songBrief: result.data.songBrief,
      structureJson: result.data.structureJson as any,
      lyricsJson: result.data.lyricsJson as any,
      performanceNotes: result.data.performanceNotes ?? "",
    },
  });

  return NextResponse.json(version, { status: 201 });
}
