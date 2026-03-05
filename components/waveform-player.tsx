"use client";
// components/waveform-player.tsx – wavesurfer.js audio player
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2 } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface Section {
  type: string;
  startSec: number;
  endSec: number;
}

interface Props {
  projectId: string;
  sections?: Section[];
  onTimeUpdate?: (sec: number) => void;
}

export function WaveformPlayer({ projectId, sections, onTimeUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { theme } = useTheme();
  const isDark = theme !== "light";

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: isDark ? "#3f3f46" : "#d4d4d8",
      progressColor: "#a855f7",
      cursorColor: "#a855f7",
      height: 80,
      normalize: true,
    });

    wsRef.current = ws;

    ws.on("ready", () => {
      setDuration(ws.getDuration());
      setLoading(false);
    });
    ws.on("audioprocess", (t) => {
      setCurrentTime(t);
      onTimeUpdate?.(t);
    });
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("error", (e) => {
      setError("Could not load audio");
      setLoading(false);
    });

    // Load audio via presigned URL
    fetch(`/api/projects/${projectId}/audio-url`)
      .then((r) => r.json())
      .then(({ url }) => {
        if (url) ws.load(url);
      })
      .catch(() => setError("Failed to load audio URL"));

    return () => ws.destroy();
  }, [projectId]);

  function togglePlay() {
    wsRef.current?.playPause();
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {loading && (
        <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">
          Loading waveform…
        </div>
      )}
      <div ref={containerRef} className={loading ? "hidden" : ""} />

      {/* Section markers (visual labels below waveform) */}
      {!loading && duration > 0 && sections && sections.length > 0 && (
        <div className="relative h-4">
          {sections.map((s, i) => (
            <div
              key={i}
              className="absolute text-[9px] text-muted-foreground truncate"
              style={{
                left: `${(s.startSec / duration) * 100}%`,
                width: `${((s.endSec - s.startSec) / duration) * 100}%`,
              }}
            >
              {s.type}
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={togglePlay}>
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
        </div>
      )}
    </div>
  );
}
