"use client";
// components/project-workspace.tsx – Main split workspace
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalysisSummary } from "@/components/analysis-summary";
import { WaveformPlayer } from "@/components/waveform-player";
import { LyricsViewer } from "@/components/lyrics-viewer";
import { LyricsEditor } from "@/components/lyrics-editor";
import { VersionHistory } from "@/components/version-history";
import { ExportButtons } from "@/components/export-buttons";
import {
  RefreshCw,
  Wand2,
  Settings,
  FileText,
  History,
  Download,
  Mic2,
  ChevronDown,
  ChevronUp,
  Music2,
} from "lucide-react";

interface LyricsLine {
  timeSec: number;
  text: string;
}
interface LyricsSection {
  section: string;
  lines: LyricsLine[];
}
interface StructureItem {
  name: string;
  startSec: number;
  endSec: number;
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
  source: string;
  lyricsJson: LyricsOutput | null;
  createdAt: string;
}
interface Project {
  id: string;
  name: string;
  sourceType: string;
  status: string;
  genre: string | null;
  vibe: string | null;
  language: string;
  bpm: number | null;
  durationSeconds: number | null;
  analysisJson: any;
  topic: string | null;
  isExplicit: boolean;
  rhyme: boolean;
  inspoArtist: string | null;
  inspoSong: string | null;
  keywords: string | null;
  audioOriginalKey: string | null;
  lyricsVersions: LyricsVersion[];
}

const STATUS_BADGE: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "warning" | "destructive" | "secondary";
  }
> = {
  created: { label: "Created", variant: "secondary" },
  analyzing: { label: "Analysing…", variant: "warning" },
  ready: { label: "Ready", variant: "success" },
  generating: { label: "Generating…", variant: "warning" },
  done: { label: "Done", variant: "success" },
  error: { label: "Error", variant: "destructive" },
};

type PanelView = "lyrics" | "editor" | "history" | "export";

export function ProjectWorkspace({ project: initial }: { project: Project }) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [activePanel, setActivePanel] = useState<PanelView>("lyrics");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTogglingRhyme, setIsTogglingRhyme] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const latestVersion = project.lyricsVersions[0] ?? null;
  const status = STATUS_BADGE[project.status] ?? STATUS_BADGE.created;

  async function reloadProject() {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      return data;
    }
    return null;
  }

  async function handleAnalyse() {
    setIsAnalysing(true);
    setStatusMsg("Analysing…");
    const res = await fetch(`/api/projects/${project.id}/analyze`, {
      method: "POST",
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatusMsg(d.error ?? "Analysis failed");
      setIsAnalysing(false);
      return;
    }
    // If synchronous (no Redis), analysis is already done
    if (d.done) {
      const fresh = await reloadProject();
      setStatusMsg(
        fresh?.status === "error" ? "Analysis failed" : "Analysis complete",
      );
      setIsAnalysing(false);
      return;
    }
    // Otherwise poll
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      await reloadProject();
      const fresh = await fetch(`/api/projects/${project.id}`).then((r) =>
        r.json(),
      );
      if (
        fresh.status === "ready" ||
        fresh.status === "done" ||
        fresh.status === "error" ||
        attempts > 30
      ) {
        clearInterval(poll);
        setProject(fresh);
        setStatusMsg(
          fresh.status === "error" ? "Analysis failed" : "Analysis complete",
        );
        setIsAnalysing(false);
      }
    }, 3000);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setStatusMsg("Generating lyrics…");
    const res = await fetch(`/api/projects/${project.id}/generate`, {
      method: "POST",
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatusMsg(d.error ?? "Error");
      setIsGenerating(false);
      return;
    }
    // If synchronous (no Redis), generation is already done
    if (d.done) {
      const fresh = await reloadProject();
      setStatusMsg("Lyrics ready!");
      setIsGenerating(false);
      if (fresh?.lyricsVersions?.length > 0) setActivePanel("lyrics");
      return;
    }
    // Otherwise poll (Redis/BullMQ queue)
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const fresh = await fetch(`/api/projects/${project.id}`).then((r) =>
        r.json(),
      );
      if (
        fresh.status === "done" ||
        fresh.status === "error" ||
        attempts > 60
      ) {
        clearInterval(poll);
        setProject(fresh);
        setStatusMsg(
          fresh.status === "error" ? "Generation failed" : "Lyrics ready!",
        );
        setIsGenerating(false);
        if (fresh.status === "done") setActivePanel("lyrics");
      }
    }, 3000);
  }

  async function handleToggleRhyme() {
    setIsTogglingRhyme(true);
    const newRhyme = !project.rhyme;
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rhyme: newRhyme }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject((p) => ({ ...p, rhyme: updated.rhyme }));
    }
    setIsTogglingRhyme(false);
  }

  async function handlePreview() {
    setIsPreviewLoading(true);
    const res = await fetch(`/api/projects/${project.id}/preview`, {
      method: "POST",
    });
    const d = await res.json();
    setStatusMsg(d.message ?? d.error ?? "");
    setIsPreviewLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant={status.variant}>{status.label}</Badge>
            {project.genre && (
              <span className="text-xs text-muted-foreground capitalize">
                {project.genre}
              </span>
            )}
            {project.vibe && (
              <span className="text-xs text-muted-foreground capitalize">
                · {project.vibe}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={isTogglingRhyme}
            onClick={handleToggleRhyme}
            title={
              project.rhyme
                ? "Rhyme: ON – click to turn off"
                : "Rhyme: OFF – click to turn on"
            }
            className={`gap-1.5 transition-colors ${
              project.rhyme
                ? "border-purple-500 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20"
                : ""
            }`}
          >
            <Music2 className="h-3.5 w-3.5" />
            Rhyme: {project.rhyme ? "ON" : "OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={isAnalysing}
            onClick={handleAnalyse}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Re-analyse
          </Button>
          <Button
            size="sm"
            loading={isGenerating}
            onClick={handleGenerate}
            disabled={
              project.status !== "ready" &&
              project.status !== "done" &&
              project.status !== "error"
            }
            className="gap-1.5"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {project.lyricsVersions.length === 0
              ? "Generate lyrics"
              : "Regenerate"}
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="mb-4 rounded-lg bg-muted px-4 py-2 text-sm text-foreground flex items-center justify-between">
          {statusMsg}
          <button
            onClick={() => setStatusMsg("")}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* ── Left panel ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Waveform player */}
          {project.audioOriginalKey && (
            <WaveformPlayer
              projectId={project.id}
              sections={(project.analysisJson as any)?.sections}
              onTimeUpdate={setCurrentTimeSec}
            />
          )}

          {/* Analysis summary */}
          <AnalysisSummary
            analysis={project.analysisJson as any}
            bpm={project.bpm ?? undefined}
            durationSeconds={project.durationSeconds ?? undefined}
          />

          {/* Project settings (collapsible) */}
          <div className="rounded-xl border border-border bg-card">
            <button
              className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground"
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Project settings
              </span>
              {settingsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {settingsOpen && (
              <div className="px-4 pb-4 text-sm text-muted-foreground space-y-1.5">
                <Row label="Genre" value={project.genre} />
                <Row label="Vibe" value={project.vibe} />
                <Row label="Language" value={project.language} />
                <Row
                  label="Explicit"
                  value={project.isExplicit ? "Yes" : "No"}
                />
                <Row label="Rhyme" value={project.rhyme ? "On" : "Off"} />
                {project.topic && <Row label="Topic" value={project.topic} />}
                {project.inspoArtist && (
                  <Row
                    label="Inspiration"
                    value={`${project.inspoArtist}${project.inspoSong ? ` – ${project.inspoSong}` : ""}`}
                  />
                )}
                {project.keywords && (
                  <Row label="Keywords" value={project.keywords} />
                )}
              </div>
            )}
          </div>

          {/* Preview voice (feature flag) */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            loading={isPreviewLoading}
            onClick={handlePreview}
          >
            <Mic2 className="h-4 w-4" /> Robot voice preview
          </Button>
        </div>

        {/* ── Right panel ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl bg-card p-1 border border-border">
            {[
              { id: "lyrics", label: "Lyrics", icon: FileText },
              { id: "editor", label: "Editor", icon: Settings },
              { id: "history", label: "History", icon: History },
              { id: "export", label: "Export", icon: Download },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id as PanelView)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePanel === id
                    ? "gradient-bg text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="min-h-[500px]">
            {activePanel === "lyrics" && latestVersion && (
              <LyricsViewer
                lyricsJson={latestVersion.lyricsJson ?? null}
                currentTimeSec={currentTimeSec}
              />
            )}
            {activePanel === "lyrics" && !latestVersion && (
              <EmptyPanel message="No lyrics yet. Click «Generate lyrics» above." />
            )}
            {activePanel === "editor" && (
              <LyricsEditor
                projectId={project.id}
                version={latestVersion}
                onSaved={(v) => {
                  setProject((p) => ({
                    ...p,
                    lyricsVersions: [
                      v as LyricsVersion,
                      ...(p.lyricsVersions as LyricsVersion[]),
                    ],
                    status: "done",
                  }));
                  setActivePanel("lyrics");
                }}
              />
            )}
            {activePanel === "history" && (
              <VersionHistory
                versions={project.lyricsVersions as any[]}
                activeVersionId={latestVersion?.id}
                onSelect={(v) => {
                  const cast = v as unknown as LyricsVersion;
                  setProject((p) => ({
                    ...p,
                    lyricsVersions: [
                      cast,
                      ...(p.lyricsVersions as LyricsVersion[]).filter(
                        (x) => x.id !== cast.id,
                      ),
                    ],
                  }));
                  setActivePanel("lyrics");
                }}
                onDelete={(versionId) => {
                  setProject((p) => {
                    const remaining = (
                      p.lyricsVersions as LyricsVersion[]
                    ).filter((x) => x.id !== versionId);
                    return {
                      ...p,
                      lyricsVersions: remaining,
                      status: remaining.length === 0 ? "ready" : p.status,
                    };
                  });
                }}
              />
            )}
            {activePanel === "export" && latestVersion && (
              <ExportButtons
                version={{ lyricsJson: latestVersion.lyricsJson ?? null }}
                projectName={project.name}
              />
            )}
            {activePanel === "export" && !latestVersion && (
              <EmptyPanel message="Generate lyrics first to export." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground/60 w-24 shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-16 flex items-center justify-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}
