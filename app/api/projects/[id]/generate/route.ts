// app/api/projects/[id]/generate/route.ts – Trigger lyrics generation with plan + rate limit
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueGeneration } from "@/lib/queues";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Enforce free plan daily limit
  if (user.plan === "free") {
    const LIMIT = Number(process.env.FREE_GENERATIONS_PER_DAY ?? 5);
    const limit = await checkRateLimit({
      key: `rl:lyrics:${userId}`,
      limit: LIMIT,
      windowSec: 86400, // 24 hours
    });
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Free plan limit reached (${LIMIT}/day). Upgrade to Pro for unlimited.`,
        },
        { status: 429 },
      );
    }
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.userId !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (project.status !== "ready" && project.status !== "done") {
    return NextResponse.json(
      { error: "Project must be analysed before generating lyrics" },
      { status: 409 },
    );
  }

  await enqueueGeneration(id, userId);

  return NextResponse.json({ queued: true });
}
