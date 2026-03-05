"use client";
// components/version-history.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface LyricsVersion {
  id: string;
  versionNumber: number;
  source: string;
  createdAt: string | Date;
  lyricsJson: unknown | null;
}

interface Props {
  versions: LyricsVersion[];
  activeVersionId?: string;
  onSelect: (v: LyricsVersion) => void;
}

export function VersionHistory({ versions, activeVersionId, onSelect }: Props) {
  if (versions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        No versions yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...versions].reverse().map((v) => {
        const isActive = v.id === activeVersionId;
        const date = new Date(v.createdAt);
        return (
          <div
            key={v.id}
            className={`rounded-lg border p-3 flex items-center justify-between gap-3 transition-colors ${
              isActive
                ? "border-purple-600/60 bg-purple-900/20"
                : "border-border bg-card hover:border-muted"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  Version {v.versionNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  {date.toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={v.source === "llm" ? "default" : "secondary"}
                className="text-[10px]"
              >
                {v.source === "llm" ? "AI" : "Edited"}
              </Badge>

              {!isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelect(v)}
                  className="text-xs h-7 px-2"
                >
                  Load
                </Button>
              )}
              {isActive && (
                <span className="text-[10px] text-purple-400 font-medium">
                  Active
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
