"use client";
// components/dashboard-client.tsx – Interactive project grid with rename, duplicate, delete
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Music2,
  Clock,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Check,
  X,
  Plus,
} from "lucide-react";
import { formatTime } from "@/lib/utils";

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

interface Project {
  id: string;
  name: string;
  genre: string | null;
  vibe: string | null;
  status: string;
  durationSeconds: number | null;
  bpm: number | null;
  createdAt: Date;
}

export function DashboardClient({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRename(id: string, name: string) {
    if (!name.trim()) return;
    setLoading(id);
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)),
      );
    }
    setRenaming(null);
    setLoading(null);
  }

  async function handleDuplicate(id: string) {
    setMenuOpen(null);
    setLoading(id);
    const res = await fetch(`/api/projects/${id}/duplicate`, {
      method: "POST",
    });
    if (res.ok) {
      const { id: newId } = await res.json();
      router.push(`/app/projects/${newId}`);
    }
    setLoading(null);
  }

  async function handleDelete(id: string) {
    setLoading(id);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
    setDeleteConfirm(null);
    setLoading(null);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/app/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center">
            <Music2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Upload a beat and let AI write your lyrics in seconds.
          </p>
          <Link href="/app/new">
            <Button>Create first project</Button>
          </Link>
        </div>
      )}

      {/* Project grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => {
          const status = STATUS_BADGE[p.status] ?? STATUS_BADGE.created;
          const isDeleting = deleteConfirm === p.id;
          const isLoading = loading === p.id;

          return (
            <div
              key={p.id}
              className="group rounded-xl border border-border bg-card p-5 hover:border-purple-500/50 transition-all hover:glow-purple space-y-4 relative"
              onClick={(e) => {
                // Don't navigate if a button inside was clicked
                if ((e.target as HTMLElement).closest("button,input")) return;
                router.push(`/app/projects/${p.id}`);
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center shrink-0 cursor-pointer"
                  onClick={() => router.push(`/app/projects/${p.id}`)}
                >
                  <Music2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {/* 3-dot menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === p.id ? null : p.id);
                        setDeleteConfirm(null);
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === p.id && (
                      <div
                        className="absolute right-0 mt-1 w-40 rounded-lg border border-border bg-card shadow-lg z-10 py-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setMenuOpen(null);
                            setRenaming({ id: p.id, value: p.name });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Rename
                        </button>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          disabled={isLoading}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-foreground disabled:opacity-50"
                        >
                          <Copy className="h-3.5 w-3.5" /> Duplicate
                        </button>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => {
                            setMenuOpen(null);
                            setDeleteConfirm(p.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Name / rename input */}
              <div>
                {renaming?.id === p.id ? (
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      autoFocus
                      value={renaming.value}
                      onChange={(e) =>
                        setRenaming({ ...renaming, value: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleRename(p.id, renaming.value);
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className="flex-1 rounded border border-purple-500/50 bg-background px-2 py-0.5 text-sm text-foreground outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={() => handleRename(p.id, renaming.value)}
                      disabled={isLoading}
                      className="text-green-400 hover:text-green-300 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setRenaming(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <h3
                    className="font-semibold text-foreground line-clamp-1 cursor-pointer"
                    onClick={() => router.push(`/app/projects/${p.id}`)}
                  >
                    {p.name}
                  </h3>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.genre && (
                    <span className="text-xs text-muted-foreground capitalize">
                      {p.genre}
                    </span>
                  )}
                  {p.vibe && (
                    <span className="text-xs text-muted-foreground capitalize">
                      · {p.vibe}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete confirmation */}
              {isDeleting && (
                <div
                  className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-medium">Delete &ldquo;{p.name}&rdquo;?</p>
                  <p className="text-destructive/70">This cannot be undone.</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={isLoading}
                      className="flex-1 py-1 rounded bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 py-1 rounded border border-border hover:bg-muted text-muted-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {p.durationSeconds ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(p.durationSeconds)}
                  </span>
                ) : null}
                {p.bpm ? <span>{p.bpm} BPM</span> : null}
                <span className="ml-auto">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  );
}
