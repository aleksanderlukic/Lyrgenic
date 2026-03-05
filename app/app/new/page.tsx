// app/app/new/page.tsx – Create project wizard wrapper
import { CreateProjectWizard } from "@/components/create-project-wizard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold">New project</h1>
        <p className="text-muted-foreground text-sm">
          Upload a beat, set your preferences and generate lyrics.
        </p>
      </div>
      <CreateProjectWizard />
    </div>
  );
}
