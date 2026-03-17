"use client";
// components/lyrics-editor.tsx
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Save,
  Loader2,
  Plus,
  Trash2,
  Wand2,
  Hash,
  Mic2,
  MessageSquare,
  X,
  Check,
} from "lucide-react";

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
  language?: string;
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

/** Approximate syllable count (supports most European languages) */
function countSyllables(text: string): number {
  if (!text.trim()) return 0;
  const lower = text.toLowerCase();
  const matches = lower.match(/[aeiouyåäöéèêëàâîïôùûüœæø]+/g);
  let n = matches ? matches.length : 1;
  if (lower.endsWith("e") && !lower.endsWith("le") && n > 1) n--;
  return Math.max(1, n);
}

export function LyricsEditor({ projectId, version, language, onSaved }: Props) {
  const { data: session } = useSession();

  const [sections, setSections] = useState<LyricsSection[]>([]);
  const [savingSection, setSavingSection] = useState<number | null>(null);
  const [regenLine, setRegenLine] = useState<{ si: number; li: number } | null>(
    null,
  );
  const [altPicker, setAltPicker] = useState<{
    si: number;
    li: number;
    options: string[];
  } | null>(null);
  const [rhymesData, setRhymesData] = useState<{
    si: number;
    li: number;
    words: string[];
  } | null>(null);
  const [rhymeLoading, setRhymeLoading] = useState<{
    si: number;
    li: number;
  } | null>(null);
  const [showSyllables, setShowSyllables] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [editingTime, setEditingTime] = useState<{
    si: number;
    li: number;
    value: string;
  } | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [openComment, setOpenComment] = useState<{
    si: number;
    li: number;
  } | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (version?.lyricsJson?.lyrics) {
      dirtyRef.current = false;
      setSections(
        version.lyricsJson.lyrics.map((s) => ({ ...s, lines: [...s.lines] })),
      );
    }
  }, [version]);

  // Auto-save: debounce 4 seconds after user edits
  useEffect(() => {
    if (!dirtyRef.current || !version || !sections.length) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const capturedVersion = version;
    const capturedSections = sections;
    autoSaveTimerRef.current = setTimeout(async () => {
      dirtyRef.current = false;
      setAutoSaveStatus("saving");
      try {
        const body = {
          lyricsJson: {
            ...capturedVersion.lyricsJson,
            lyrics: capturedSections,
          },
        };
        const res = await fetch(`/api/projects/${projectId}/save-version`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const saved = await res.json();
          onSaved(saved);
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        } else {
          setAutoSaveStatus("idle");
        }
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 4000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [sections]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load per-line comments from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`lyrgenic-comments-${projectId}`);
    if (stored) {
      try {
        setComments(JSON.parse(stored));
      } catch {
        /* ignore corrupt data */
      }
    }
  }, [projectId]);

  const commentKey = (si: number, li: number) => `${si}:${li}`;

  const updateComment = (si: number, li: number, text: string) => {
    const key = commentKey(si, li);
    const updated = { ...comments, [key]: text };
    setComments(updated);
    localStorage.setItem(
      `lyrgenic-comments-${projectId}`,
      JSON.stringify(updated),
    );
  };

  const commitTimeEdit = () => {
    if (!editingTime) return;
    const { si, li, value } = editingTime;
    const parts = value.split(":");
    let secs = 0;
    if (parts.length === 2) {
      secs = parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
    } else {
      secs = parseFloat(parts[0]);
    }
    if (!isNaN(secs) && secs >= 0) {
      dirtyRef.current = true;
      setSections((prev) =>
        prev.map((s, i) =>
          i === si
            ? {
                ...s,
                lines: s.lines.map((l, j) =>
                  j === li ? { ...l, timeSec: Math.round(secs) } : l,
                ),
              }
            : s,
        ),
      );
    }
    setEditingTime(null);
  };

  const handleLineChange = (si: number, li: number, text: string) => {
    dirtyRef.current = true;
    setAltPicker(null);
    setRhymesData(null);
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

  const insertLineAfter = (si: number, li: number) => {
    dirtyRef.current = true;
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
    dirtyRef.current = true;
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== si) return s;
        if (s.lines.length <= 1) return s;
        return { ...s, lines: s.lines.filter((_, j) => j !== li) };
      }),
    );
  };

  const applyAlt = (si: number, li: number, text: string) => {
    dirtyRef.current = true;
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
    setAltPicker(null);
  };

  const fetchRhymes = async (si: number, li: number) => {
    if (rhymesData?.si === si && rhymesData?.li === li) {
      setRhymesData(null);
      return;
    }
    const lineText = sections[si]?.lines[li]?.text ?? "";
    const lastWord = lineText
      .trim()
      .split(/\s+/)
      .pop()
      ?.replace(/[^\w\u00C0-\u024F]/g, "");
    if (!lastWord) return;
    setRhymeLoading({ si, li });
    setRhymesData(null);
    try {
      const res = await fetch("/api/rhyme-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: lastWord,
          language: language ?? "English",
        }),
      });
      if (res.ok) {
        const { rhymes } = await res.json();
        setRhymesData({ si, li, words: rhymes });
      }
    } catch {
      /* silently fail */
    } finally {
      setRhymeLoading(null);
    }
  };

  const applyRhyme = (si: number, li: number, rhymeWord: string) => {
    dirtyRef.current = true;
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== si) return s;
        return {
          ...s,
          lines: s.lines.map((l, j) => {
            if (j !== li) return l;
            const words = l.text.trimEnd().split(/\s+/);
            words[words.length - 1] = rhymeWord;
            return { ...l, text: words.join(" ") };
          }),
        };
      }),
    );
    setRhymesData(null);
  };

  const regenSingleLine = async (si: number, li: number) => {
    if (!version) return;
    setRegenLine({ si, li });
    setAltPicker(null);
    setRhymesData(null);
    setRegenError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/regen-line`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId: version.id,
          sectionName: sections[si].section,
          lineIndex: li,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error ?? "Request failed");
      }
      const { lines } = await res.json();
      // Show 3 alternatives to pick from instead of directly replacing
      setAltPicker({ si, li, options: lines });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRegenError(msg);
    } finally {
      setRegenLine(null);
    }
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
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSyllables((v) => !v)}
            title="Toggle syllable counter"
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
              showSyllables
                ? "border-purple-500 text-purple-400 bg-purple-500/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Hash className="h-3 w-3" /> Syllables
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {autoSaveStatus === "saving" && "Saving…"}
          {autoSaveStatus === "saved" && (
            <span className="text-green-400 flex items-center gap-1">
              <Check className="h-3 w-3" /> Auto-saved
            </span>
          )}
        </span>
      </div>

      {regenError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex justify-between items-center gap-2">
          <span>Regen failed: {regenError}</span>
          <button
            onClick={() => setRegenError(null)}
            className="text-destructive/60 hover:text-destructive text-xs shrink-0"
          >
            ✕
          </button>
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
            <div key={li}>
              {/* Main line row */}
              <div className="group flex items-start gap-2 rounded-md px-2 py-0.5 hover:bg-muted/40 transition-colors">
                {editingTime?.si === si && editingTime?.li === li ? (
                  <input
                    autoFocus
                    value={editingTime.value}
                    onChange={(e) =>
                      setEditingTime({ ...editingTime, value: e.target.value })
                    }
                    onBlur={commitTimeEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitTimeEdit();
                      if (e.key === "Escape") setEditingTime(null);
                    }}
                    className="text-[10px] tabular-nums pt-2 w-8 shrink-0 bg-purple-500/10 border border-purple-500/40 rounded text-center outline-none text-purple-300"
                  />
                ) : (
                  <button
                    onClick={() =>
                      setEditingTime({
                        si,
                        li,
                        value: `${Math.floor(line.timeSec / 60)}:${String(
                          Math.floor(line.timeSec % 60),
                        ).padStart(2, "0")}`,
                      })
                    }
                    className="text-muted-foreground/50 text-[10px] tabular-nums pt-2 w-8 shrink-0 hover:text-purple-400 transition-colors text-left"
                    title="Click to edit timestamp"
                  >
                    {Math.floor(line.timeSec / 60)}:
                    {String(Math.floor(line.timeSec % 60)).padStart(2, "0")}
                  </button>
                )}

                <div className="flex-1">
                  <AutoTextarea
                    value={line.text}
                    placeholder="Write a line…"
                    onChange={(v) => handleLineChange(si, li, v)}
                    onEnter={() => insertLineAfter(si, li)}
                    onBackspaceEmpty={() => deleteLine(si, li)}
                  />
                  {showSyllables && line.text && (
                    <span className="text-[10px] text-muted-foreground/50">
                      {countSyllables(line.text)} syl
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1 shrink-0">
                  <button
                    onClick={() => regenSingleLine(si, li)}
                    disabled={regenLine !== null}
                    className="text-muted-foreground hover:text-purple-400 p-0.5 disabled:opacity-40"
                    title="Suggest 3 alternatives for this line"
                  >
                    {regenLine?.si === si && regenLine?.li === li ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => fetchRhymes(si, li)}
                    disabled={rhymeLoading !== null}
                    className={`p-0.5 disabled:opacity-40 ${
                      rhymesData?.si === si && rhymesData?.li === li
                        ? "text-green-400"
                        : "text-muted-foreground hover:text-green-400"
                    }`}
                    title="Rhyme suggestions for last word"
                  >
                    {rhymeLoading?.si === si && rhymeLoading?.li === li ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mic2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      setOpenComment(
                        openComment?.si === si && openComment?.li === li
                          ? null
                          : { si, li },
                      )
                    }
                    className={`p-0.5 ${
                      openComment?.si === si && openComment?.li === li
                        ? "text-yellow-400"
                        : comments[commentKey(si, li)]
                          ? "text-yellow-400/60"
                          : "text-muted-foreground hover:text-yellow-400"
                    }`}
                    title="Add a note to this line"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
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

              {/* Alt-picker: 3 AI alternatives */}
              {altPicker?.si === si && altPicker?.li === li && (
                <div className="ml-10 mt-1 mb-2 rounded-md border border-purple-500/30 bg-purple-500/5 p-2 space-y-1">
                  <p className="text-[10px] text-purple-400 mb-1.5 font-medium">
                    Choose an alternative:
                  </p>
                  {altPicker.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyAlt(si, li, opt)}
                      className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-purple-500/20 text-foreground transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                  <button
                    onClick={() => setAltPicker(null)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-1"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              )}

              {/* Rhyme suggestions */}
              {rhymesData?.si === si && rhymesData?.li === li && (
                <div className="ml-10 mt-1 mb-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-muted-foreground">
                    Rhymes:
                  </span>
                  {rhymesData.words.map((word) => (
                    <button
                      key={word}
                      onClick={() => applyRhyme(si, li, word)}
                      className="text-xs px-2 py-0.5 rounded-full border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors"
                      title="Replace last word with this rhyme"
                    >
                      {word}
                    </button>
                  ))}
                  <button
                    onClick={() => setRhymesData(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Per-line comment */}
              {openComment?.si === si && openComment?.li === li && (
                <div className="ml-10 mt-1 mb-2">
                  <textarea
                    autoFocus
                    value={comments[commentKey(si, li)] ?? ""}
                    onChange={(e) => updateComment(si, li, e.target.value)}
                    placeholder="Add a note for this line…"
                    rows={2}
                    className="w-full text-xs bg-yellow-500/5 border border-yellow-500/20 rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40 resize-none outline-none focus:border-yellow-500/50"
                  />
                  <button
                    onClick={() => setOpenComment(null)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-0.5"
                  >
                    <X className="h-3 w-3" /> Close
                  </button>
                </div>
              )}
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
