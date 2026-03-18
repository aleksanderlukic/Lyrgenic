// app/api/collections/[id]/route.ts – PATCH (rename) + DELETE
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RenameSchema = z.object({
  name: z.string().min(1).max(80).trim(),
});

async function ownsCollection(userId: string, id: string) {
  const col = await prisma.collection.findUnique({
    where: { id },
    select: { userId: true },
  });
  return col?.userId === userId;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await ownsCollection(session.user.id, id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = RenameSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.collection.update({
    where: { id },
    data: { name: parsed.data.name },
    select: { id: true, name: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await ownsCollection(session.user.id, id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.collection.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
