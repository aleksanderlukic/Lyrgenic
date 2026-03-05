// app/page.tsx – Landing page
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Music2,
  Upload,
  Wand2,
  Edit3,
  Zap,
  Clock,
  Globe,
  Star,
  ArrowRight,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload your beat",
    desc: "Drop an mp3, wav, m4a or flac file – or paste a YouTube link. We analyse BPM, energy and structure automatically.",
  },
  {
    icon: Wand2,
    step: "02",
    title: "Set the vibe",
    desc: "Pick genre, mood, language and topic. Optionally provide an inspiration artist and song for style guidance.",
  },
  {
    icon: Edit3,
    step: "03",
    title: "Get lyrics + edit",
    desc: "AI generates structured lyrics with timestamps for every section. Edit inline, regenerate sections and save versions.",
  },
];

const FEATURES = [
  {
    icon: Clock,
    title: "Timestamped lyrics",
    desc: "Every line is timed to match your beat's intro, verses, choruses and outro.",
  },
  {
    icon: Globe,
    title: "Multi-language",
    desc: "Generate in English, Swedish and more. Custom language support included.",
  },
  {
    icon: Zap,
    title: "Section regeneration",
    desc: "Not happy with the chorus? Regenerate only that section while keeping the rest.",
  },
  {
    icon: Music2,
    title: "Version history",
    desc: "Every generation is saved. Roll back or compare across versions any time.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-40 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-blue-500/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
            <Zap className="h-3.5 w-3.5" />
            AI-powered lyric generation
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Create songs from <span className="gradient-text">any beat</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload a beat (or paste a YouTube link) and Lyrgenic writes the
            lyrics — with timestamps for every section.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground/50">
            No credit card required · Completely free, forever
          </p>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three steps from blank beat to finished song.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="relative flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl gradient-bg p-3 shadow-lg glow-purple">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-4xl font-black text-foreground/10 select-none">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to write a hit
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Professional songwriter tools powered by AI.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="p-6 hover:border-purple-500/40 transition-colors"
              >
                <CardContent className="p-0 space-y-3">
                  <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof placeholder ──────────────────────────── */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-3xl sm:text-4xl font-bold">What artists say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Generated a full verse in 30 seconds that actually fit my drill beat perfectly.",
                who: "Producer, @beats.by.kxng",
              },
              {
                quote:
                  "The timestamp feature is insane. Sync with the track is spot on.",
                who: "Artist, @real_solace",
              },
              {
                quote:
                  "Finally an AI tool that understands song structure and vibe.",
                who: "Songwriter, @lindqvist_writes",
              },
            ].map(({ quote, who }) => (
              <Card key={who} className="p-6">
                <CardContent className="p-0 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/80 italic">"{quote}"</p>
                  <p className="text-xs text-muted-foreground">{who}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-muted/20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold">Start writing your next hit</h2>
          <p className="text-muted-foreground">
            Completely free, forever. No credit card needed.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
