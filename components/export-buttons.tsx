"use client";
// components/export-buttons.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileJson, FileText, Check } from "lucide-react";

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

interface Props {
  version: { lyricsJson: LyricsOutput | null };
  projectName: string;
}

function buildPlainText(lyricsJson: LyricsOutput, projectName: string): string {
  const lines: string[] = [];
  const title = lyricsJson.title ?? projectName;
  lines.push(title);
  lines.push("=".repeat(title.length));
  if (lyricsJson.songBrief) lines.push(`\n${lyricsJson.songBrief}`);
  lines.push("");
  for (const s of lyricsJson.lyrics) {
    lines.push(`[${s.section}]`);
    for (const l of s.lines) {
      const m = Math.floor(l.timeSec / 60);
      const sec = String(Math.floor(l.timeSec % 60)).padStart(2, "0");
      lines.push(`${m}:${sec}  ${l.text}`);
    }
    lines.push("");
  }
  if (lyricsJson.performanceNotes) {
    lines.push("--- Notes ---");
    lines.push(lyricsJson.performanceNotes);
  }
  return lines.join("\n");
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ version, projectName }: Props) {
  const [copied, setCopied] = useState(false);

  if (!version.lyricsJson?.lyrics?.length) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        Generate lyrics first to enable export.
      </div>
    );
  }

  const lyricsJson = version.lyricsJson;
  const safeName = projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  const handleCopy = async () => {
    const text = buildPlainText(lyricsJson, projectName);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTxt = () => {
    const text = buildPlainText(lyricsJson, projectName);
    downloadText(text, `${safeName}_lyrics.txt`);
  };

  const handleJson = () => {
    downloadJSON(lyricsJson, `${safeName}_lyrics.json`);
  };

  // Minimal .docx-like RTF export (no external deps required in browser)
  const handleDocx = () => {
    const text = buildPlainText(lyricsJson, projectName);
    // Build a very simple RTF document
    const escaped = text
      .replace(/\\/g, "\\\\")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}");
    const rtfLines = escaped.split("\n").map((l) => l + "\\line");
    const rtf =
      "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Arial;}}\n\\f0\\fs24\n" +
      rtfLines.join("\n") +
      "\n}";
    const blob = new Blob([rtf], { type: "application/rtf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_lyrics.rtf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Download or copy your finished lyrics.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="justify-start gap-2"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy to Clipboard"}
        </Button>

        <Button
          variant="outline"
          onClick={handleTxt}
          className="justify-start gap-2"
        >
          <FileText className="h-4 w-4" />
          Download .txt
        </Button>

        <Button
          variant="outline"
          onClick={handleDocx}
          className="justify-start gap-2"
        >
          <Download className="h-4 w-4" />
          Download .rtf (Word)
        </Button>

        <Button
          variant="outline"
          onClick={handleJson}
          className="justify-start gap-2"
        >
          <FileJson className="h-4 w-4" />
          Export JSON
        </Button>
      </div>
    </div>
  );
}
