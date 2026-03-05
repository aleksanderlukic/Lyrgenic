// app/api/projects/[id]/analyze/route.ts – Trigger analysis job
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueAnalysis } from "@/lib/queues";

export const maxDuration = 120;

export async function POST(
  _req: Request,
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

  await enqueueAnalysis(id, session.user.id);

  return NextResponse.json({ done: true });
}
