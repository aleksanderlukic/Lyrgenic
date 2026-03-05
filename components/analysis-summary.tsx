"use client";
// components/analysis-summary.tsx
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Activity, Music2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Section {
  type: string;
  startSec: number;
  endSec: number;
  confidence?: number;
}

interface Props {
  analysis?: {
    bpm?: number | null;
    durationSeconds?: number;
    sections?: Section[];
    energySummary?: string;
  } | null;
  bpm?: number;
  durationSeconds?: number;
}

const SECTION_COLORS: Record<string, string> = {
  intro: "bg-blue-500/20 text-blue-300",
  verse: "bg-purple-500/20 text-purple-300",
  chorus: "bg-pink-500/20 text-pink-300",
  bridge: "bg-yellow-500/20 text-yellow-300",
  outro: "bg-muted text-foreground",
  break: "bg-green-500/20 text-green-300",
};

export function AnalysisSummary({ analysis, bpm, durationSeconds }: Props) {
  const effectiveBpm = analysis?.bpm ?? bpm;
  const effectiveDuration = analysis?.durationSeconds ?? durationSeconds;
  const sections = analysis?.sections ?? [];

  if (!analysis && !bpm && !durationSeconds) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-purple-400" />
          Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {effectiveBpm && (
            <div className="rounded-lg bg-muted p-3 flex items-center gap-2">
              <Music2 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground">BPM</p>
                <p className="font-bold text-lg text-foreground">
                  {Math.round(effectiveBpm)}
                </p>
              </div>
            </div>
          )}
          {effectiveDuration && (
            <div className="rounded-lg bg-muted p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-bold text-lg text-foreground">
                  {formatTime(effectiveDuration)}
                </p>
              </div>
            </div>
          )}
        </div>

        {analysis?.energySummary && (
          <p className="text-xs text-muted-foreground">
            {analysis.energySummary}
          </p>
        )}

        {sections.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Sections
            </p>
            <div className="space-y-1">
              {sections.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 font-medium ${SECTION_COLORS[s.type] ?? "bg-muted text-foreground"}`}
                  >
                    {s.type}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatTime(s.startSec)} – {formatTime(s.endSec)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
