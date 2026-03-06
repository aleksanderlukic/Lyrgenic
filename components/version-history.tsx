"use client";
// components/version-history.tsx
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, Loader2 } from "lucide-react";

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
  onDelete?: (versionId: string) => void;
}

export function VersionHistory({
  versions,
  activeVersionId,
  onSelect,
  onDelete,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(versionId: string) {
    if (confirmId !== versionId) {
      setConfirmId(versionId);
      return;
    }
    setConfirmId(null);
    setDeletingId(versionId);
    try {
      const res = await fetch(`/api/lyrics-versions/${versionId}`, {
        method: "DELETE",
      });
      if (res.ok) onDelete?.(versionId);
    } finally {
      setDeletingId(null);
    }
  }

  if (versions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        No versions yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...versions]
        .sort((a, b) => b.versionNumber - a.versionNumber)
        .map((v) => {
          const isActive = v.id === activeVersionId;
          const isDeleting = deletingId === v.id;
          const isConfirming = confirmId === v.id;
          const date = new Date(v.createdAt);
          return (
            <div
              key={v.id}
              onClick={() => {
                if (!isActive) {
                  setConfirmId(null);
                  onSelect(v);
                }
              }}
              className={`rounded-lg border p-3 flex items-center justify-between gap-3 transition-colors ${
                isActive
                  ? "border-purple-600/60 bg-purple-900/20"
                  : "border-border bg-card hover:border-purple-500/40 cursor-pointer"
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

                {isActive && (
                  <span className="text-[10px] text-purple-400 font-medium">
                    Active
                  </span>
                )}

                <Button
                  size="sm"
                  variant={isConfirming ? "destructive" : "ghost"}
                  onClick={() => handleDelete(v.id)}
                  disabled={isDeleting}
                  className="h-7 w-7 p-0"
                  title={
                    isConfirming ? "Click again to confirm" : "Delete version"
                  }
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
