"use client";
// components/create-project-wizard.tsx – 3-step wizard
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Card, CardContent } from "@/components/ui/card";
import { AudioUploader } from "@/components/audio-uploader";
import { YouTubeInput } from "@/components/youtube-input";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";

// ─── Schemas ──────────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(1, "Project name required").max(200),
  sourceType: z.enum(["upload", "youtube"]),
  audioKey: z.string().optional(),
  audioMime: z.string().optional(),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  bpm: z.string().optional(),
});

const step2Schema = z.object({
  genre: z.string().min(1, "Please pick a genre"),
  vibe: z.string().min(1, "Please pick a vibe"),
  language: z.string().min(1),
  isExplicit: z.boolean(),
  topic: z.string().max(1000).optional(),
  inspoArtist: z.string().max(100).optional(),
  inspoSong: z.string().max(200).optional(),
});

const GENRES = ["rap", "drill", "afrobeat", "pop", "rnb", "rock", "custom"];
const VIBES = [
  "sad",
  "happy",
  "dark",
  "romantic",
  "aggressive",
  "motivational",
];
const LANGUAGES = [
  "English",
  "Swedish",
  "Spanish",
  "French",
  "Portuguese",
  "Other",
];

const STEPS = ["Beat", "Preferences", "Generate"];

export function CreateProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 data
  const [step1, setStep1] = useState({
    name: "",
    sourceType: "upload" as "upload" | "youtube",
    audioKey: "",
    audioMime: "",
    youtubeUrl: "",
    bpm: "",
  });

  // Step 2 data
  const [step2, setStep2] = useState({
    genre: "rap",
    vibe: "motivational",
    language: "English",
    isExplicit: false,
    rhyme: false,
    topic: "",
    inspoArtist: "",
    inspoSong: "",
  });

  // ── Step 1 validation ───────────────────────────────────────────────
  function validateStep1() {
    if (!step1.name.trim()) return "Project name is required";
    if (step1.sourceType === "upload" && !step1.audioKey)
      return "Please upload a beat";
    if (step1.sourceType === "youtube" && !step1.youtubeUrl)
      return "Please enter a YouTube URL";
    return null;
  }

  // ── Submit final form ───────────────────────────────────────────────
  async function handleFinish() {
    setIsSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: step1.name,
          sourceType: step1.sourceType,
          audioOriginalKey: step1.audioKey || null,
          audioMime: step1.audioMime || null,
          youtubeUrl: step1.youtubeUrl || null,
          bpm: step1.bpm ? parseFloat(step1.bpm) : undefined,
          genre: step2.genre,
          vibe: step2.vibe,
          language: step2.language,
          isExplicit: step2.isExplicit,
          rhyme: step2.rhyme,
          topic: step2.topic,
          inspoArtist: step2.inspoArtist,
          inspoSong: step2.inspoSong,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      // Trigger analysis
      await fetch(`/api/projects/${data.id}/analyze`, { method: "POST" });

      router.push(`/app/projects/${data.id}`);
    } catch (e: any) {
      setServerError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-0 flex-1">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors",
                i < step
                  ? "gradient-bg text-white"
                  : i === step
                    ? "border-2 border-purple-500 text-purple-400"
                    : "border border-border text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "ml-2 text-sm font-medium",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-4",
                  i < step ? "bg-purple-500" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Beat ─────────────────────────────────────────────── */}
      {step === 0 && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-1.5">
              <Label>Project name</Label>
              <Input
                placeholder="My club banger"
                value={step1.name}
                onChange={(e) =>
                  setStep1((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            {/* Source type toggle */}
            <div className="flex gap-3">
              {(["upload", "youtube"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStep1((p) => ({ ...p, sourceType: t }))}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                    step1.sourceType === t
                      ? "border-purple-500 text-purple-400 bg-purple-500/10"
                      : "border-border text-muted-foreground hover:border-muted",
                  )}
                >
                  {t === "upload" ? "Upload file" : "YouTube link"}
                </button>
              ))}
            </div>

            {step1.sourceType === "upload" ? (
              <AudioUploader
                onUploaded={(key, mime) =>
                  setStep1((p) => ({ ...p, audioKey: key, audioMime: mime }))
                }
              />
            ) : (
              <YouTubeInput
                value={step1.youtubeUrl}
                onChange={(url) => setStep1((p) => ({ ...p, youtubeUrl: url }))}
              />
            )}

            <div className="space-y-1.5">
              <Label>BPM (optional – helps with lyric rhythm)</Label>
              <Input
                type="number"
                placeholder="e.g. 140"
                min={20}
                max={400}
                value={step1.bpm}
                onChange={(e) =>
                  setStep1((p) => ({ ...p, bpm: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: Preferences ──────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Genre</Label>
                <Select
                  value={step2.genre}
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, genre: e.target.value }))
                  }
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vibe / Mood</Label>
                <Select
                  value={step2.vibe}
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, vibe: e.target.value }))
                  }
                >
                  {VIBES.map((v) => (
                    <option key={v} value={v}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select
                value={step2.language}
                onChange={(e) =>
                  setStep2((p) => ({ ...p, language: e.target.value }))
                }
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <Toggle
                checked={step2.isExplicit}
                onChange={(v) => setStep2((p) => ({ ...p, isExplicit: v }))}
                label="Allow explicit content"
              />
              <Toggle
                checked={step2.rhyme}
                onChange={(v) => setStep2((p) => ({ ...p, rhyme: v }))}
                label="Rhyme"
                description={
                  step2.rhyme
                    ? "Lyrics will rhyme naturally and smoothly"
                    : "Lyrics will flow freely without focusing on rhyming"
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Topic / Story{" "}
                <span className="text-muted-foreground/60 text-xs">
                  (optional)
                </span>
              </Label>
              <Textarea
                placeholder="e.g. A late-night drive, missing someone you lost…"
                rows={3}
                value={step2.topic}
                onChange={(e) =>
                  setStep2((p) => ({ ...p, topic: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Inspiration artist{" "}
                  <span className="text-muted-foreground/60 text-xs">
                    (style ref only)
                  </span>
                </Label>
                <Input
                  placeholder="e.g. Drake"
                  value={step2.inspoArtist}
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, inspoArtist: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Inspiration song{" "}
                  <span className="text-muted-foreground/60 text-xs">
                    (style ref only)
                  </span>
                </Label>
                <Input
                  placeholder="e.g. Passionfruit"
                  value={step2.inspoSong}
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, inspoSong: e.target.value }))
                  }
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground/60">
              * Inspiration artist/song is used for style guidance only. No
              lyrics will be copied.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Review & generate ────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold text-lg">Ready to generate</h3>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <Row label="Project" value={step1.name} />
              <Row
                label="Source"
                value={
                  step1.sourceType === "upload"
                    ? "Audio upload"
                    : step1.youtubeUrl
                }
              />
              <Row label="Genre" value={step2.genre} />
              <Row label="Vibe" value={step2.vibe} />
              <Row label="Language" value={step2.language} />
              {step2.topic && <Row label="Topic" value={step2.topic} />}
              <Row label="Rhyme" value={step2.rhyme ? "On" : "Off"} />
              {step2.inspoArtist && (
                <Row
                  label="Inspired by"
                  value={`${step2.inspoArtist}${step2.inspoSong ? ` – ${step2.inspoSong}` : ""}`}
                />
              )}
            </div>
            {serverError && (
              <p className="text-sm text-red-400">{serverError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : (
          <div />
        )}

        {step < 2 ? (
          <Button
            onClick={() => {
              if (step === 0) {
                const err = validateStep1();
                if (err) {
                  setServerError(err);
                  return;
                }
                setServerError("");
              }
              setStep((s) => s + 1);
            }}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button loading={isSubmitting} onClick={handleFinish}>
            Create & Analyse
          </Button>
        )}
      </div>

      {serverError && step !== 2 && (
        <p className="text-sm text-red-400 text-center">{serverError}</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-28 shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
