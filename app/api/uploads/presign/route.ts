// app/api/uploads/presign/route.ts – Return presigned S3 upload URL
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { z } from "zod";
import { nanoid } from "nanoid";

const ALLOWED_MIMES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/flac",
  "audio/x-flac",
];

const Schema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string(),
  size: z.number().max(500 * 1024 * 1024), // 500 MB max
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = Schema.safeParse(body);
  if (!result.success)
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 422 },
    );

  const { filename, contentType, size } = result.data;

  if (!ALLOWED_MIMES.includes(contentType)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: mp3, wav, m4a, flac" },
      { status: 415 },
    );
  }

  const ext = filename.split(".").pop() ?? "mp3";
  const key = `uploads/${session.user.id}/${nanoid(16)}.${ext}`;

  const url = await getPresignedUploadUrl(key, contentType);

  return NextResponse.json({ url, key, contentType });
}
