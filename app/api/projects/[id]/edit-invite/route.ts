// app/api/projects/[id]/edit-invite/route.ts
// POST → generate/return editToken   DELETE → revoke editToken
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

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

  // Reuse existing token or generate a new one
  const editToken = project.editToken ?? randomBytes(18).toString("base64url");

  const updated = await prisma.project.update({
    where: { id },
    data: { editToken },
  });

  return NextResponse.json({ editToken: updated.editToken });
}

export async function DELETE(
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

  await prisma.project.update({ where: { id }, data: { editToken: null } });
  // Also remove all collaborators when invite is revoked
  await prisma.projectCollaborator.deleteMany({ where: { projectId: id } });

  return NextResponse.json({ ok: true });
}
