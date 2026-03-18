"use client";
// components/analysis-summary.tsx
import { formatTime } from "@/lib/utils";
import { Activity, Music2, Clock, Pencil, Check, X } from "lucide-react";
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
  // Inline duration editing
  durationEditing?: boolean;
  durationDraft?: string;
  onEditDuration?: () => void;
  onDurationDraftChange?: (v: string) => void;
  onSaveDuration?: () => void;
  onCancelDuration?: () => void;
}

const SECTION_COLORS: Record<string, string> = {
  intro: "bg-blue-500/20 text-blue-300",
  verse: "bg-purple-500/20 text-purple-300",
  chorus: "bg-pink-500/20 text-pink-300",
  bridge: "bg-yellow-500/20 text-yellow-300",
  outro: "bg-muted text-foreground",
  break: "bg-green-500/20 text-green-300",
};

export function AnalysisSummary({
  analysis,
  bpm,
  durationSeconds,
  durationEditing,
  durationDraft,
  onEditDuration,
  onDurationDraftChange,
  onSaveDuration,
  onCancelDuration,
}: Props) {
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
            <div className="rounded-lg bg-muted p-3 flex items-center gap-2 group relative">
              <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
              {durationEditing ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        autoFocus
                        type="number"
                        min={5}
                        max={600}
                        value={durationDraft}
                        onChange={(e) =>
                          onDurationDraftChange?.(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onSaveDuration?.();
                          if (e.key === "Escape") onCancelDuration?.();
                        }}
                        placeholder="seconds"
                        className="w-20 rounded border border-blue-500/50 bg-background px-1.5 py-0.5 text-sm font-bold text-foreground outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-muted-foreground">s</span>
                      <button
                        onClick={onSaveDuration}
                        className="text-green-400 hover:text-green-300 ml-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={onCancelDuration}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-bold text-lg text-foreground">
                      {formatTime(effectiveDuration)}
                    </p>
                  </div>
                  {onEditDuration && (
                    <button
                      onClick={onEditDuration}
                      title="Set actual beat duration"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
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
