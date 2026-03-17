// app/api/projects/[id]/share/route.ts – Generate or revoke a read-only share link
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

  const p = project as any;
  if (p.shareToken) {
    return NextResponse.json({ shareToken: p.shareToken });
  }

  const shareToken = randomBytes(24).toString("base64url");
  await (prisma.project as any).update({
    where: { id },
    data: { shareToken },
  });

  return NextResponse.json({ shareToken });
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

  await (prisma.project as any).update({
    where: { id },
    data: { shareToken: null },
  });

  return NextResponse.json({ ok: true });
}
