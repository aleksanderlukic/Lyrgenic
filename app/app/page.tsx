// app/app/page.tsx – Dashboard
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Music2, Clock, FolderOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

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

export default async function DashboardPage() {
  const session = await auth();

  const projects = await prisma.project.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      genre: true,
      vibe: true,
      status: true,
      durationSeconds: true,
      bpm: true,
      createdAt: true,
    },
  });

  type Project = (typeof projects)[number];

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
        {projects.map((p: Project) => {
          const status = STATUS_BADGE[p.status] ?? STATUS_BADGE.created;
          return (
            <Link key={p.id} href={`/app/projects/${p.id}`}>
              <div className="group rounded-xl border border-border bg-card p-5 hover:border-purple-500/50 transition-all hover:glow-purple cursor-pointer space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                    <Music2 className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {p.name}
                  </h3>
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}
