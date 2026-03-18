"use client";
// components/audio-uploader.tsx – drag-and-drop file uploader
import { useCallback, useRef, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onUploaded: (key: string, mime: string, durationSeconds?: number) => void;
}

const ALLOWED = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/flac",
  "audio/x-flac",
];
const MAX_MB = 500;

export function AudioUploader({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle",
  );
  const [filename, setFilename] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [detectedDuration, setDetectedDuration] = useState<number | undefined>(
    undefined,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  /** Read audio duration in the browser immediately from the local File object. */
  async function readBrowserDuration(file: File): Promise<number | undefined> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(undefined), 5000);
      try {
        const objectUrl = URL.createObjectURL(file);
        const audio = new Audio(objectUrl);
        audio.onloadedmetadata = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(objectUrl);
          const d = audio.duration;
          resolve(isFinite(d) && d > 0 ? d : undefined);
        };
        audio.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(objectUrl);
          resolve(undefined);
        };
      } catch {
        clearTimeout(timeout);
        resolve(undefined);
      }
    });
  }

  const upload = useCallback(
    async (file: File) => {
      if (!ALLOWED.includes(file.type)) {
        setErrorMsg("Unsupported format. Use mp3, wav, m4a or flac.");
        setStatus("error");
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setErrorMsg(`File too large (max ${MAX_MB} MB).`);
        setStatus("error");
        return;
      }

      setStatus("uploading");
      setFilename(file.name);
      setProgress(0);
      setErrorMsg("");

      // 1. Read duration from browser before upload starts
      const durationSeconds = await readBrowserDuration(file);
      setDetectedDuration(durationSeconds);

      try {
        // 2. Get presigned URL
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });
        const { url, key, contentType } = await presignRes.json();
        if (!presignRes.ok) throw new Error(url?.error ?? "Presign failed");

        // 3. Upload directly to S3
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", url);
          xhr.setRequestHeader("Content-Type", contentType);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable)
              setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () =>
            xhr.status < 300
              ? resolve()
              : reject(new Error(`S3 upload failed: ${xhr.status}`));
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        setStatus("done");
        setProgress(100);
        onUploaded(key, file.type, durationSeconds);
      } catch (e: any) {
        setErrorMsg(e.message ?? "Upload failed");
        setStatus("error");
      }
    },
    [onUploaded],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-4 transition-colors cursor-pointer",
        dragging
          ? "border-purple-400 bg-purple-500/10"
          : "border-border hover:border-muted",
        status === "done" && "border-green-500/50 bg-green-500/5",
        status === "error" && "border-red-500/50 bg-red-500/5",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => status !== "uploading" && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.flac,audio/*"
        className="hidden"
        onChange={handleChange}
      />

      {status === "idle" && (
        <>
          <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Drop your beat here</p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse (mp3, wav, m4a, flac · max 500 MB)
            </p>
          </div>
        </>
      )}

      {status === "uploading" && (
        <>
          <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center">
            <Music2 className="h-6 w-6 text-muted-foreground animate-pulse" />
          </div>
          <p className="text-sm text-foreground">{filename}</p>
          <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-bg transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </>
      )}

      {status === "done" && (
        <>
          <CheckCircle2 className="h-10 w-10 text-green-400" />
          <p className="font-medium text-green-300">{filename}</p>
          {detectedDuration ? (
            <p className="text-xs text-muted-foreground">
              {Math.floor(detectedDuration / 60)}:
              {String(Math.round(detectedDuration % 60)).padStart(2, "0")}{" "}
              detected
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Uploaded successfully
            </p>
          )}
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-red-300">{errorMsg}</p>
          <p className="text-xs text-muted-foreground">Click to try again</p>
        </>
      )}
    </div>
  );
}
