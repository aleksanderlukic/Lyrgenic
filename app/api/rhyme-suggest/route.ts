// app/api/rhyme-suggest/route.ts – Suggest rhyming words for a given word
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { suggestRhymes } from "@/lib/openai";
import { z } from "zod";

const Schema = z.object({
  word: z.string().min(1).max(60),
  language: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { word, language } = Schema.parse(body);
  const rhymes = await suggestRhymes({ word, language });
  return NextResponse.json({ rhymes });
}
