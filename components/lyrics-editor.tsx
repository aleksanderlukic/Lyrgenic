"use client";
// components/lyrics-editor.tsx
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Save, Loader2 } from "lucide-react";

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

export function LyricsEditor({ projectId, version, onSaved }: Props) {
  const { data: session } = useSession();
  const isPro = true; // FREE_MODE: all features available

  const [sections, setSections] = useState<LyricsSection[]>([]);
  const [savingSection, setSavingSection] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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
          ? {
              ...s,
              lines: s.lines.map((l, j) => (j === li ? { ...l, text } : l)),
            }
          : s,
      ),
    );
  };

  const regenSection = async (sectionIndex: number) => {
    if (!version) return;
    const sectionName = sections[sectionIndex].section;
    setSavingSection(sectionIndex);
    try {
      const res = await fetch(`/api/projects/${projectId}/regen-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionName, versionId: version.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { version: updated } = await res.json();
      onSaved(updated);
    } catch (err) {
      console.error("Regen failed:", err);
    } finally {
      setSavingSection(null);
    }
  };

  const saveVersion = async () => {
    if (!version) return;
    setSaving(true);
    try {
      const body = {
        lyricsJson: {
          ...version.lyricsJson,
          lyrics: sections,
        },
      };
      const res = await fetch(`/api/projects/${projectId}/save-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const { version: saved } = await res.json();
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
    <div className="space-y-5">
      {sections.map((section, si) => (
        <div key={si} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
              [{section.section}]
            </p>
            <Button
              size="sm"
              variant="ghost"
              disabled={savingSection === si}
              onClick={() => regenSection(si)}
            >
              {savingSection === si ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Regen</span>
            </Button>
          </div>
          <div className="space-y-1">
            {section.lines.map((line, li) => (
              <div key={li} className="flex gap-2 items-start">
                <span className="text-muted-foreground/60 text-[10px] tabular-nums pt-2 w-8 shrink-0">
                  {Math.floor(line.timeSec / 60)}:
                  {String(Math.floor(line.timeSec % 60)).padStart(2, "0")}
                </span>
                <Textarea
                  className="min-h-[36px] h-auto text-sm resize-none py-1.5"
                  rows={1}
                  value={line.text}
                  onChange={(e) => handleLineChange(si, li, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={saveVersion} disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Version
        </Button>
      </div>
    </div>
  );
}
