// app/api/collections/[id]/projects/route.ts – POST (add) + DELETE (remove)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BodySchema = z.object({ projectId: z.string().cuid() });

async function ownsCollection(userId: string, id: string) {
  const col = await prisma.collection.findUnique({
    where: { id },
    select: { userId: true },
  });
  return col?.userId === userId;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: collectionId } = await params;
  if (!(await ownsCollection(session.user.id, collectionId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { projectId } = parsed.data;

  // Verify the project belongs to the same user
  const proj = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (proj?.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.projectCollection.upsert({
    where: { projectId_collectionId: { projectId, collectionId } },
    create: { projectId, collectionId },
    update: {},
  });

  return new NextResponse(null, { status: 204 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: collectionId } = await params;
  if (!(await ownsCollection(session.user.id, collectionId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId)
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  await prisma.projectCollection.deleteMany({
    where: { projectId, collectionId },
  });

  return new NextResponse(null, { status: 204 });
}
