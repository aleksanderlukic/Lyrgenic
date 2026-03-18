"use client";
// components/dashboard-client.tsx – Interactive project grid with rename, duplicate, delete, collections
import { useState, useRef } from "react";
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
  FolderOpen,
  Folder,
  ChevronRight,
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

interface Collection {
  id: string;
  name: string;
  projectIds: string[];
}

export function DashboardClient({
  initialProjects,
  initialCollections,
}: {
  initialProjects: Project[];
  initialCollections: Collection[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [collections, setCollections] =
    useState<Collection[]>(initialCollections);

  // Project menu
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Collection state
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [colMenuOpen, setColMenuOpen] = useState<string | null>(null);
  const [colRenaming, setColRenaming] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [colDeleteConfirm, setColDeleteConfirm] = useState<string | null>(null);
  const [newColDraft, setNewColDraft] = useState<string | null>(null);
  const [colLoading, setColLoading] = useState<string | null>(null);
  const [addToColFor, setAddToColFor] = useState<string | null>(null);

  // Drag-and-drop
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const dragCounter = useRef(0);

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
      setCollections((prev) =>
        prev.map((c) => ({
          ...c,
          projectIds: c.projectIds.filter((pid) => pid !== id),
        })),
      );
    }
    setDeleteConfirm(null);
    setLoading(null);
  }

  // ─── Collection handlers ───────────────────────────────────────────

  async function handleCreateCollection() {
    const name = newColDraft?.trim();
    if (!name) return setNewColDraft(null);
    setColLoading("new");
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const col: Collection = await res.json();
      setCollections((prev) => [...prev, col]);
      setActiveCollection(col.id);
    }
    setNewColDraft(null);
    setColLoading(null);
  }

  async function handleRenameCollection(id: string, name: string) {
    if (!name.trim()) return setColRenaming(null);
    setColLoading(id);
    const res = await fetch(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)),
      );
    }
    setColRenaming(null);
    setColLoading(null);
  }

  async function handleDeleteCollection(id: string) {
    setColLoading(id);
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (activeCollection === id) setActiveCollection(null);
    }
    setColDeleteConfirm(null);
    setColLoading(null);
  }

  async function toggleProjectInCollection(
    projectId: string,
    collectionId: string,
  ) {
    const col = collections.find((c) => c.id === collectionId);
    if (!col) return;
    const isIn = col.projectIds.includes(projectId);

    if (isIn) {
      await fetch(
        `/api/collections/${collectionId}/projects?projectId=${projectId}`,
        {
          method: "DELETE",
        },
      );
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                projectIds: c.projectIds.filter((pid) => pid !== projectId),
              }
            : c,
        ),
      );
    } else {
      await fetch(`/api/collections/${collectionId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, projectIds: [...c.projectIds, projectId] }
            : c,
        ),
      );
    }
    setAddToColFor(null);
    setMenuOpen(null);
  }

  // ─── Drag-and-drop handlers ────────────────────────────────────────

  function handleDragStart(projectId: string) {
    setDragging(projectId);
  }

  function handleDragEnd() {
    setDragging(null);
    setDragOver(null);
    dragCounter.current = 0;
  }

  function handleCollectionDragEnter(collectionId: string) {
    dragCounter.current++;
    setDragOver(collectionId);
  }

  function handleCollectionDragLeave() {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOver(null);
  }

  async function handleCollectionDrop(collectionId: string) {
    dragCounter.current = 0;
    setDragOver(null);
    if (!dragging) return;
    const col = collections.find((c) => c.id === collectionId);
    if (!col || col.projectIds.includes(dragging)) return;
    await fetch(`/api/collections/${collectionId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: dragging }),
    });
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, projectIds: [...c.projectIds, dragging] }
          : c,
      ),
    );
    setDragging(null);
  }

  // ─── Derived ──────────────────────────────────────────────────────

  const visibleProjects =
    activeCollection === null
      ? projects
      : projects.filter((p) =>
          collections
            .find((c) => c.id === activeCollection)
            ?.projectIds.includes(p.id),
        );

  const activeCollectionName =
    collections.find((c) => c.id === activeCollection)?.name ?? "Your projects";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{activeCollectionName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {visibleProjects.length} project
            {visibleProjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/app/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </Link>
      </div>

      {/* Collection tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* All pill */}
        <button
          onClick={() => setActiveCollection(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeCollection === null
              ? "bg-purple-600 text-white"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <Music2 className="h-3.5 w-3.5" />
          All
        </button>

        {/* Collection pills */}
        {collections.map((col) => {
          const isActive = activeCollection === col.id;
          const isRenamingCol = colRenaming?.id === col.id;
          const isColMenuOpen = colMenuOpen === col.id;
          const isDeleting = colDeleteConfirm === col.id;
          const isDragTarget = dragOver === col.id;

          return (
            <div
              key={col.id}
              className="relative group/col"
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDragEnter={() => handleCollectionDragEnter(col.id)}
              onDragLeave={handleCollectionDragLeave}
              onDrop={() => handleCollectionDrop(col.id)}
            >
              {isRenamingCol ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-purple-500/50 bg-muted">
                  <input
                    autoFocus
                    value={colRenaming.value}
                    onChange={(e) =>
                      setColRenaming({ ...colRenaming, value: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleRenameCollection(col.id, colRenaming.value);
                      if (e.key === "Escape") setColRenaming(null);
                    }}
                    className="w-24 bg-transparent text-sm outline-none text-foreground"
                  />
                  <button
                    onClick={() =>
                      handleRenameCollection(col.id, colRenaming.value)
                    }
                    className="text-green-400 hover:text-green-300"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setColRenaming(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveCollection(isActive ? null : col.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isDragTarget
                      ? "bg-purple-500/30 border-2 border-purple-500 text-purple-300 scale-105"
                      : isActive
                        ? "bg-purple-600 text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {isActive || isDragTarget ? (
                    <FolderOpen className="h-3.5 w-3.5" />
                  ) : (
                    <Folder className="h-3.5 w-3.5" />
                  )}
                  {col.name}
                  <span
                    className={`text-xs ${isActive ? "text-purple-200" : "text-muted-foreground/60"}`}
                  >
                    {col.projectIds.length}
                  </span>
                </button>
              )}

              {/* Options button on hover */}
              {!isRenamingCol && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setColMenuOpen(isColMenuOpen ? null : col.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center opacity-0 group-hover/col:opacity-100 transition-opacity hover:bg-muted/80 z-10"
                >
                  <MoreVertical className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              )}

              {/* Collection dropdown */}
              {isColMenuOpen && !isRenamingCol && (
                <div
                  className="absolute left-0 top-full mt-1 w-36 rounded-lg border border-border bg-card shadow-lg z-20 py-1 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setColMenuOpen(null);
                      setColRenaming({ id: col.id, value: col.name });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </button>
                  <div className="border-t border-border my-1" />
                  {isDeleting ? (
                    <div className="px-3 py-2 space-y-2">
                      <p className="text-xs text-destructive font-medium">
                        Delete &ldquo;{col.name}&rdquo;?
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleDeleteCollection(col.id)}
                          disabled={colLoading === col.id}
                          className="flex-1 py-1 rounded text-xs bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setColDeleteConfirm(null)}
                          className="flex-1 py-1 rounded text-xs border border-border hover:bg-muted text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setColDeleteConfirm(col.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* New collection */}
        {newColDraft !== null ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-purple-500/50 bg-muted">
            <input
              autoFocus
              placeholder="Collection name"
              value={newColDraft}
              onChange={(e) => setNewColDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateCollection();
                if (e.key === "Escape") setNewColDraft(null);
              }}
              className="w-32 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={handleCreateCollection}
              disabled={colLoading === "new"}
              className="text-green-400 hover:text-green-300 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setNewColDraft(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setNewColDraft("")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-purple-500/50 transition-colors"
          >
            <Plus className="h-3 w-3" />
            New collection
          </button>
        )}
      </div>

      {/* Drag hint */}
      {dragging && collections.length > 0 && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Drop onto a collection above to add the project
        </p>
      )}

      {/* Empty state */}
      {visibleProjects.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center">
            {activeCollection ? (
              <FolderOpen className="h-8 w-8 text-white" />
            ) : (
              <Music2 className="h-8 w-8 text-white" />
            )}
          </div>
          {activeCollection ? (
            <>
              <h2 className="text-lg font-semibold">
                No projects in this collection
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Drag a project card onto the collection tab, or use the
                &ldquo;Collections&rdquo; menu option.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">No projects yet</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Upload a beat and let AI write your lyrics in seconds.
              </p>
              <Link href="/app/new">
                <Button>Create first project</Button>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Project grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleProjects.map((p) => {
          const status = STATUS_BADGE[p.status] ?? STATUS_BADGE.created;
          const isDeleting = deleteConfirm === p.id;
          const isLoading = loading === p.id;
          const showAddToCol = addToColFor === p.id;
          const isDraggingThis = dragging === p.id;

          return (
            <div
              key={p.id}
              draggable
              onDragStart={() => handleDragStart(p.id)}
              onDragEnd={handleDragEnd}
              className={`group rounded-xl border border-border bg-card p-5 hover:border-purple-500/50 transition-all hover:glow-purple space-y-4 relative cursor-grab active:cursor-grabbing ${isDraggingThis ? "opacity-50 scale-95" : ""}`}
              onClick={(e) => {
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
                        setAddToColFor(null);
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === p.id && (
                      <div
                        className="absolute right-0 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-10 py-1 text-sm"
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

                        {/* Collections sub-menu */}
                        {collections.length > 0 && (
                          <>
                            <div className="border-t border-border my-1" />
                            <button
                              onClick={() =>
                                setAddToColFor(showAddToCol ? null : p.id)
                              }
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-foreground"
                            >
                              <Folder className="h-3.5 w-3.5" />
                              Collections
                              <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                            </button>
                            {showAddToCol && (
                              <div className="border-t border-border/50 mx-2 my-1 pt-1 space-y-0.5">
                                {collections.map((col) => {
                                  const inCol = col.projectIds.includes(p.id);
                                  return (
                                    <button
                                      key={col.id}
                                      onClick={() =>
                                        toggleProjectInCollection(p.id, col.id)
                                      }
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-foreground text-xs"
                                    >
                                      {inCol ? (
                                        <Check className="h-3 w-3 text-purple-400 shrink-0" />
                                      ) : (
                                        <div className="h-3 w-3 rounded-sm border border-border shrink-0" />
                                      )}
                                      <span className="truncate">
                                        {col.name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}

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

      {/* Close dropdowns on outside click */}
      {(menuOpen || colMenuOpen) && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => {
            setMenuOpen(null);
            setColMenuOpen(null);
            setAddToColFor(null);
            setColDeleteConfirm(null);
          }}
        />
      )}
    </div>
  );
}
