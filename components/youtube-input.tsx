"use client";
// components/youtube-input.tsx – YouTube URL input with disclaimer
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export function YouTubeInput({ value, onChange }: Props) {
  const isValidYT = value.match(
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{11}/,
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>YouTube URL</Label>
        <Input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={value && !isValidYT ? "border-red-500/60" : ""}
        />
        {value && !isValidYT && (
          <p className="text-xs text-red-400">
            Enter a valid YouTube video URL
          </p>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-300 space-y-1">
          <p className="font-medium">Important</p>
          <p>
            Lyrgenic does not download or redistribute audio from YouTube. Paste
            the link as a reference for your project. Audio analysis requires an
            uploaded file. You are responsible for having the rights to any
            content you reference.
          </p>
        </div>
      </div>
    </div>
  );
}
