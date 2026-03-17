// lib/project-access.ts – shared helper to check project access (owner OR collaborator)
import { prisma } from "./prisma";

/**
 * Returns the project (with lyricsVersions + collaborators) if the given userId
 * is either the owner or an accepted collaborator. Returns null otherwise.
 */
export async function getProjectWithAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      lyricsVersions: { orderBy: { versionNumber: "desc" } },
      collaborators: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });
  if (!project) return null;
  const isOwner = project.userId === userId;
  const isCollab = project.collaborators.some((c) => c.userId === userId);
  if (!isOwner && !isCollab) return null;
  return { project, isOwner };
}
