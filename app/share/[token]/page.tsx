// app/share/[token]/page.tsx – Public read-only shared lyrics page
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { LyricsViewer } from "@/components/lyrics-viewer";

interface ShareData {
  name: string;
  genre: string | null;
  vibe: string | null;
  language: string;
  bpm: number | null;
  durationSeconds: number | null;
  latestVersion: {
    versionNumber: number;
    lyricsJson: any;
  } | null;
}

async function getSharedProject(token: string): Promise<ShareData | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/share/${token}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getSharedProject(token);

  if (!data) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {data.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {data.genre && <Badge variant="secondary">{data.genre}</Badge>}
            {data.vibe && <span className="capitalize">{data.vibe}</span>}
            <span>{data.language}</span>
            {data.bpm && <span>{Math.round(data.bpm)} BPM</span>}
            {data.durationSeconds && (
              <span>
                {Math.floor(data.durationSeconds / 60)}:
                {String(Math.round(data.durationSeconds % 60)).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>

        {/* Lyrics */}
        <div className="rounded-xl border border-border bg-card p-6">
          {data.latestVersion ? (
            <LyricsViewer lyricsJson={data.latestVersion.lyricsJson} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No lyrics available yet.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Created with{" "}
          <a href="/" className="text-purple-400 hover:underline">
            Lyrgenic
          </a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
