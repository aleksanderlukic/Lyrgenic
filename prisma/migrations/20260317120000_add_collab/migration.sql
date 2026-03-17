-- Add editToken to Project
ALTER TABLE "Project" ADD COLUMN "editToken" TEXT;
CREATE UNIQUE INDEX "Project_editToken_key" ON "Project"("editToken");

-- Add ProjectCollaborator table
CREATE TABLE "ProjectCollaborator" (
    "id"        TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "addedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectCollaborator_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectCollaborator_projectId_userId_key"
    ON "ProjectCollaborator"("projectId", "userId");

ALTER TABLE "ProjectCollaborator"
    ADD CONSTRAINT "ProjectCollaborator_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectCollaborator"
    ADD CONSTRAINT "ProjectCollaborator_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
