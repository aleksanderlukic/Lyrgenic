"use client";
// components/project-workspace.tsx – Main split workspace
import { useState, useCallback, useEffect } from "react";
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
  Play,
  Pause,
  Square,
  Volume2,
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
  youtubeUrl: string | null;
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
  const [beatOpen, setBeatOpen] = useState(false);
  const [beatFileUrl, setBeatFileUrl] = useState<string | null>(null);
  const [beatFileLoading, setBeatFileLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewState, setPreviewState] = useState<
    "idle" | "playing" | "paused"
  >("idle");
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [voiceMap, setVoiceMap] = useState<
    Record<string, SpeechSynthesisVoice | null>
  >({});
  const [selectedVoicePreset, setSelectedVoicePreset] =
    useState<string>("normal");
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load browser voices (async on some browsers)
  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis?.getVoices() ?? [];
      if (v.length) setAvailableVoices(v);
    }
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () =>
      window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  /** Map project language names to BCP 47 language codes */
  const LANG_CODE: Record<string, string> = {
    English: "en",
    Swedish: "sv",
    Spanish: "es",
    French: "fr",
    Portuguese: "pt",
    German: "de",
    Italian: "it",
    Dutch: "nl",
  };

  // Assign a unique voice to each preset whenever voices or language changes
  useEffect(() => {
    if (!availableVoices.length) return;
    const lang = LANG_CODE[project.language] ?? "en";
    // Sort: language-matching voices first, then others
    const pool = [...availableVoices].sort((a, b) => {
      const aL = a.lang.startsWith(lang) ? 0 : 1;
      const bL = b.lang.startsWith(lang) ? 0 : 1;
      return aL - bL;
    });
    const used = new Set<string>();
    // Gender hints that work across languages (partial name matches)
    const maleHints = [
      "male",
      "man",
      "david",
      "jorge",
      "carlos",
      "hans",
      "pierre",
      "thomas",
      "oskar",
      "luca",
      "xander",
      "mark",
      "alex",
      "daniel",
    ];
    const femaleHints = [
      "female",
      "woman",
      "zira",
      "helena",
      "amelie",
      "alva",
      "paulina",
      "anna",
      "alice",
      "claire",
      "samantha",
      "hazel",
      "karen",
    ];
    function grab(hints: string[]): SpeechSynthesisVoice | null {
      // 1. Language + hint match (unused)
      for (const h of hints) {
        const v = pool.find(
          (v) =>
            !used.has(v.voiceURI) &&
            v.lang.startsWith(lang) &&
            v.name.toLowerCase().includes(h),
        );
        if (v) {
          used.add(v.voiceURI);
          return v;
        }
      }
      // 2. Any unused voice in the correct language (language > uniqueness)
      const langUnused = pool.find(
        (v) => !used.has(v.voiceURI) && v.lang.startsWith(lang),
      );
      if (langUnused) {
        used.add(langUnused.voiceURI);
        return langUnused;
      }
      // 3. Reuse any language-matching voice rather than using a wrong-language voice
      const langAny = pool.find((v) => v.lang.startsWith(lang));
      if (langAny) return langAny;
      // 4. Hint only, wrong language (last resort)
      for (const h of hints) {
        const v = pool.find(
          (v) => !used.has(v.voiceURI) && v.name.toLowerCase().includes(h),
        );
        if (v) {
          used.add(v.voiceURI);
          return v;
        }
      }
      // 5. Anything unused
      const v = pool.find((v) => !used.has(v.voiceURI));
      if (v) {
        used.add(v.voiceURI);
        return v;
      }
      return pool[0] ?? null;
    }
    setVoiceMap({
      normal: grab(maleHints),
      female: grab(femaleHints),
      "deep-robot": grab(maleHints),
      "high-robot": grab(femaleHints),
      "slow-robot": grab(maleHints),
      "fast-robot": grab([...maleHints, ...femaleHints]),
      alien: grab([...femaleHints, ...maleHints]),
    });
  }, [availableVoices, project.language]);
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

  /** Flatten all lyrics lines from the latest version into a single string */
  function getLyricsText(): string | null {
    const lj = latestVersion?.lyricsJson as any;
    if (!lj) return null;
    const sections: any[] = Array.isArray(lj) ? lj : (lj.lyrics ?? []);
    return sections
      .flatMap((s: any) => (s.lines ?? []).map((l: any) => l.text ?? ""))
      .filter(Boolean)
      .join(" ... ");
  }

  // Voice presets: name → { pitch, rate }
  const VOICE_PRESETS: Record<
    string,
    { label: string; pitch: number; rate: number }
  > = {
    normal: { label: "Normal", pitch: 1.0, rate: 1.0 },
    female: { label: "Female", pitch: 1.2, rate: 1.0 },
    "deep-robot": { label: "Deep Robot", pitch: 0.1, rate: 0.8 },
    "high-robot": { label: "High Robot", pitch: 2.0, rate: 1.0 },
    "slow-robot": { label: "Slow & Eerie", pitch: 0.2, rate: 0.6 },
    "fast-robot": { label: "Fast Robot", pitch: 0.8, rate: 1.4 },
    alien: { label: "Alien", pitch: 1.8, rate: 0.75 },
  };

  function handlePreviewPlay() {
    if (!window.speechSynthesis) {
      setStatusMsg("Your browser does not support speech synthesis.");
      return;
    }
    const text = getLyricsText();
    if (!text) {
      setStatusMsg("Generate lyrics first to preview the robot voice.");
      return;
    }
    // Resume if paused
    if (previewState === "paused") {
      window.speechSynthesis.resume();
      setPreviewState("playing");
      return;
    }
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const preset = VOICE_PRESETS[selectedVoicePreset];
    const langCode = LANG_CODE[project.language] ?? "en";
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = preset.rate;
    utter.pitch = preset.pitch;
    utter.volume = 1;
    utter.lang = langCode;
    const voice = voiceMap[selectedVoicePreset] ?? null;
    if (voice) utter.voice = voice;
    utter.onstart = () => setPreviewState("playing");
    utter.onend = () => setPreviewState("idle");
    utter.onerror = () => setPreviewState("idle");
    window.speechSynthesis.speak(utter);
    setPreviewState("playing");
  }

  function handlePreviewPause() {
    if (window.speechSynthesis?.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPreviewState("paused");
    }
  }

  function handlePreviewStop() {
    window.speechSynthesis?.cancel();
    setPreviewState("idle");
  }

  function getYoutubeId(url: string): string | null {
    const m = url.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{11})/);
    return m?.[1] ?? null;
  }

  async function handleToggleBeat() {
    if (beatOpen) {
      setBeatOpen(false);
      return;
    }
    if (project.sourceType === "file" && !beatFileUrl) {
      setBeatFileLoading(true);
      try {
        const res = await fetch(`/api/projects/${project.id}/audio-url`);
        if (res.ok) {
          const data = await res.json();
          setBeatFileUrl(data.url);
        }
      } finally {
        setBeatFileLoading(false);
      }
    }
    setBeatOpen(true);
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
          {(project.sourceType === "youtube" && project.youtubeUrl) ||
          project.audioOriginalKey ? (
            <Button
              variant="outline"
              size="sm"
              loading={beatFileLoading}
              onClick={handleToggleBeat}
              className={`gap-1.5 transition-colors ${
                beatOpen
                  ? "border-blue-500 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
                  : ""
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" />
              {beatOpen ? "Hide beat" : "Play beat"}
            </Button>
          ) : null}
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

      {beatOpen && (
        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          {project.sourceType === "youtube" && project.youtubeUrl ? (
            (() => {
              const vid = getYoutubeId(project.youtubeUrl);
              return vid ? (
                <iframe
                  src={`https://www.youtube.com/embed/${vid}`}
                  className="w-full rounded"
                  style={{ height: 180 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <a
                  href={project.youtubeUrl ?? ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 underline"
                >
                  Open YouTube link
                </a>
              );
            })()
          ) : beatFileUrl ? (
            <audio controls src={beatFileUrl} className="w-full" />
          ) : (
            <p className="text-sm text-muted-foreground">No audio available.</p>
          )}
        </div>
      )}

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

          {/* Robot Voice Preview */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Mic2 className="h-4 w-4 text-purple-400" />
              Robot voice preview
            </div>
            <p className="text-xs text-muted-foreground">
              {previewState === "playing"
                ? "Playing…"
                : previewState === "paused"
                  ? "Paused"
                  : latestVersion
                    ? "Listen to your lyrics read by a synthetic voice."
                    : "Generate lyrics first to enable preview."}
            </p>
            {/* Voice style selector */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground/70">Voice style</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(VOICE_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (previewState !== "idle") {
                        window.speechSynthesis?.cancel();
                        setPreviewState("idle");
                      }
                      setSelectedVoicePreset(key);
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedVoicePreset === key
                        ? "border-purple-500 text-purple-400 bg-purple-500/10"
                        : "border-border text-muted-foreground hover:border-muted"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={previewState === "playing" ? "default" : "outline"}
                className="flex-1 gap-1.5"
                onClick={handlePreviewPlay}
                disabled={!latestVersion}
              >
                <Play className="h-3.5 w-3.5" />
                {previewState === "paused" ? "Resume" : "Play"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handlePreviewPause}
                disabled={previewState !== "playing"}
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 px-3"
                onClick={handlePreviewStop}
                disabled={previewState === "idle"}
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
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
