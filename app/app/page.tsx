// app/app/page.tsx – Dashboard
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

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

  return (
    <DashboardClient initialProjects={JSON.parse(JSON.stringify(projects))} />
  );
}
