// app/api/collections/route.ts – GET (list) + POST (create)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(80).trim(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      projects: { select: { projectId: true } },
    },
  });

  return NextResponse.json(
    collections.map((c) => ({
      id: c.id,
      name: c.name,
      projectIds: c.projects.map((p) => p.projectId),
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const collection = await prisma.collection.create({
    data: { userId: session.user.id, name: parsed.data.name },
    select: { id: true, name: true },
  });

  return NextResponse.json({ ...collection, projectIds: [] }, { status: 201 });
}
