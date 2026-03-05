// app/api/auth/register/route.ts – Credentials sign-up
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = Schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 422 },
    );
  }

  const { name, email, password } = result.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[register] DB error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
