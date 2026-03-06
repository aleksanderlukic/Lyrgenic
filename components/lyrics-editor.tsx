"use client";
// components/lyrics-editor.tsx
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Save, Loader2, Plus, Trash2 } from "lucide-react";

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

interface LyricsVersion {
  id: string;
  versionNumber: number;
  lyricsJson: LyricsOutput | null;
}

interface Props {
  projectId: string;
  version: LyricsVersion | null;
  onSaved: (version: LyricsVersion) => void;
}

function AutoTextarea({
  value,
  onChange,
  onEnter,
  onBackspaceEmpty,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  onBackspaceEmpty?: () => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e.target.value);
        if (ref.current) {
          ref.current.style.height = "auto";
          ref.current.style.height = ref.current.scrollHeight + "px";
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter?.();
        }
        if (e.key === "Backspace" && value === "") {
          e.preventDefault();
          onBackspaceEmpty?.();
        }
      }}
      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none overflow-hidden outline-none border-none focus:ring-0 py-1 leading-6"
    />
  );
}

export function LyricsEditor({ projectId, version, onSaved }: Props) {
  const { data: session } = useSession();

  const [sections, setSections] = useState<LyricsSection[]>([]);
  const [savingSection, setSavingSection] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  useEffect(() => {
    if (version?.lyricsJson?.lyrics) {
      setSections(
        version.lyricsJson.lyrics.map((s) => ({ ...s, lines: [...s.lines] })),
      );
    }
  }, [version]);

  const handleLineChange = (si: number, li: number, text: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === si
          ? { ...s, lines: s.lines.map((l, j) => (j === li ? { ...l, text } : l)) }
          : s,
      ),
    );
  };

  const insertLineAfter = (si: number, li: number) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== si) return s;
        const refLine = s.lines[li];
        const nextLine = s.lines[li + 1];
        const newTime = nextLine
          ? (refLine.timeSec + nextLine.timeSec) / 2
          : refLine.timeSec + 2;
        const newLines = [...s.lines];
        newLines.splice(li + 1, 0, { timeSec: Math.round(newTime), text: "" });
        return { ...s, lines: newLines };
      }),
    );
  };

  const deleteLine = (si: number, li: number) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== si) return s;
        if (s.lines.length <= 1) return s;
        return { ...s, lines: s.lines.filter((_, j) => j !== li) };
      }),
    );
  };

  const regenSection = async (sectionIndex: number) => {
    if (!version) return;
    const sectionName = sections[sectionIndex].section;
    setSavingSection(sectionIndex);
    setRegenError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/regen-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionName, versionId: version.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error ?? "Request failed");
      }
      const { version: updated } = await res.json();
      onSaved(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRegenError(msg);
      console.error("Regen failed:", msg);
    } finally {
      setSavingSection(null);
    }
  };

  const saveVersion = async () => {
    if (!version) return;
    setSaving(true);
    try {
      const body = { lyricsJson: { ...version.lyricsJson, lyrics: sections } };
      const res = await fetch(`/api/projects/${projectId}/save-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      onSaved(saved);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!version) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        Generate lyrics first to enable editing.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {regenError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex justify-between items-center gap-2">
          <span>Regen failed: {regenError}</span>
          <button onClick={() => setRegenError(null)} className="text-destructive/60 hover:text-destructive text-xs shrink-0">✕</button>
        </div>
      )}
      {sections.map((section, si) => (
        <div key={si} className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
              [{section.section}]
            </p>
            <Button
              size="sm"
              variant="ghost"
              disabled={savingSection === si}
              onClick={() => regenSection(si)}
              className="h-6 px-2 text-xs gap-1"
            >
              {savingSection === si ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Regen
            </Button>
          </div>

          {section.lines.map((line, li) => (
            <div
              key={li}
              className="group flex items-start gap-2 rounded-md px-2 py-0.5 hover:bg-muted/40 transition-colors"
            >
              <span className="text-muted-foreground/50 text-[10px] tabular-nums pt-2 w-8 shrink-0">
                {Math.floor(line.timeSec / 60)}:
                {String(Math.floor(line.timeSec % 60)).padStart(2, "0")}
              </span>

              <div className="flex-1">
                <AutoTextarea
                  value={line.text}
                  placeholder="Write a line…"
                  onChange={(v) => handleLineChange(si, li, v)}
                  onEnter={() => insertLineAfter(si, li)}
                  onBackspaceEmpty={() => deleteLine(si, li)}
                />
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1 shrink-0">
                <button
                  onClick={() => insertLineAfter(si, li)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  title="Add line below"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteLine(si, li)}
                  className="text-muted-foreground hover:text-destructive p-0.5"
                  title="Delete line"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <Button onClick={saveVersion} disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save version
        </Button>
      </div>
    </div>
  );
}
