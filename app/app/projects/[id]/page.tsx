// app/app/projects/[id]/page.tsx – Project workspace (server shell)
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ProjectWorkspace } from "@/components/project-workspace";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: project?.name ?? "Project" };
}

export default async function ProjectPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/sign-in");

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      lyricsVersions: { orderBy: { versionNumber: "desc" } },
    },
  });

  if (!project) notFound();
  if (project.userId !== session.user.id) notFound();

  return <ProjectWorkspace project={JSON.parse(JSON.stringify(project))} />;
}
