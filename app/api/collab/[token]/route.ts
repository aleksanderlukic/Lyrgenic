// app/api/collab/[token]/route.ts
// POST → accept invite (logged-in user becomes collaborator)
// GET  → return project info for the invite page (title, owner name)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const project = await prisma.project.findUnique({
    where: { editToken: token },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!project)
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });

  return NextResponse.json({
    projectId: project.id,
    projectName: project.name,
    ownerName: project.user.name ?? project.user.email,
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;
  const project = await prisma.project.findUnique({
    where: { editToken: token },
  });
  if (!project)
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });

  // Owner doesn't need to join as collaborator
  if (project.userId === session.user.id)
    return NextResponse.json({ projectId: project.id, alreadyOwner: true });

  // Upsert collaborator record
  await prisma.projectCollaborator.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: session.user.id },
    },
    create: { projectId: project.id, userId: session.user.id },
    update: {},
  });

  return NextResponse.json({ projectId: project.id });
}
