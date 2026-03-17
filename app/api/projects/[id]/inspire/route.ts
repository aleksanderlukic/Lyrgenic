// app/api/projects/[id]/inspire/route.ts – Generate song topic/hook inspiration
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInspiration } from "@/lib/openai";
import { getProjectWithAccess } from "@/lib/project-access";
import { z } from "zod";

const Schema = z.object({
  mood: z.string().max(200).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await getProjectWithAccess(id, session.user.id);
  if (!access)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { project } = access;

  const body = await req.json().catch(() => ({}));
  const { mood } = Schema.parse(body);

  const result = await generateInspiration({
    genre: project.genre ?? undefined,
    vibe: project.vibe ?? undefined,
    language: project.language,
    mood,
  });

  return NextResponse.json(result);
}
