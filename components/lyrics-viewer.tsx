"use client";
// components/lyrics-viewer.tsx
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LyricLine {
  timeSec: number;
  text: string;
}

interface LyricsSection {
  section: string;
  lines: LyricLine[];
}

interface LyricsOutput {
  title?: string;
  songBrief?: string;
  lyrics: LyricsSection[];
  performanceNotes?: string;
}

interface Props {
  lyricsJson: LyricsOutput | null;
  currentTimeSec?: number;
}

export function LyricsViewer({ lyricsJson, currentTimeSec = 0 }: Props) {
  const activeRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentTimeSec]);

  if (!lyricsJson) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        No lyrics yet — click "Generate Lyrics" to get started.
      </div>
    );
  }

  const { title, songBrief, lyrics, performanceNotes } = lyricsJson;

  // Flatten all lines with their times to determine active line
  const allLines = lyrics.flatMap((s) => s.lines);
  let activeTime: number | null = null;
  for (const line of allLines) {
    if (line.timeSec <= currentTimeSec) activeTime = line.timeSec;
  }

  return (
    <div className="space-y-5 text-sm">
      {title && (
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      )}
      {songBrief && (
        <p className="text-muted-foreground text-xs italic">{songBrief}</p>
      )}

      {lyrics.map((section, si) => (
        <div key={si} className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
            [{section.section}]
          </p>
          {section.lines.map((line, li) => {
            const isActive = line.timeSec === activeTime;
            return (
              <p
                key={li}
                ref={isActive ? activeRef : null}
                className={cn(
                  "transition-colors duration-200 leading-relaxed",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="mr-2 select-none text-muted-foreground/50 text-[10px] tabular-nums w-8 inline-block">
                  {Math.floor(line.timeSec / 60)}:
                  {String(Math.floor(line.timeSec % 60)).padStart(2, "0")}
                </span>
                {line.text}
              </p>
            );
          })}
        </div>
      ))}

      {performanceNotes && (
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <span className="text-foreground/70 font-medium">Notes: </span>
          {performanceNotes}
        </div>
      )}
    </div>
  );
}
