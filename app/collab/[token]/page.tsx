"use client";
// app/collab/[token]/page.tsx – Accept a collaboration invite
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

export default function CollabAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [info, setInfo] = useState<{
    projectName: string;
    ownerName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState(false);

  // Fetch invite info
  useEffect(() => {
    fetch(`/api/collab/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setInfo({ projectName: d.projectName, ownerName: d.ownerName });
      })
      .catch(() => setError("Failed to load invite"));
  }, [token]);

  async function handleAccept() {
    if (status === "unauthenticated") {
      // Redirect to sign-in then come back
      signIn(undefined, {
        callbackUrl: `/collab/${token}`,
      });
      return;
    }
    setJoining(true);
    const res = await fetch(`/api/collab/${token}`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setDone(true);
      setTimeout(() => {
        router.push(`/app/projects/${data.projectId}`);
      }, 1500);
    } else {
      setError(data.error ?? "Failed to join");
      setJoining(false);
    }
  }

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-destructive text-lg font-medium">{error}</p>
          <p className="text-muted-foreground text-sm">
            This invite link may be invalid or expired.
          </p>
        </div>
      </div>
    );

  if (!info)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading invite…</p>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-2xl border border-border bg-card p-8 space-y-6 text-center shadow-lg">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            You&apos;ve been invited to collaborate on
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {info.projectName}
          </h1>
          <p className="text-sm text-muted-foreground">by {info.ownerName}</p>
        </div>

        {done ? (
          <p className="text-green-400 font-medium">✓ Joined! Redirecting…</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground/80">
              As a collaborator you can edit lyrics, regenerate sections and
              lines, and use all editor tools alongside the owner.
            </p>
            <button
              onClick={handleAccept}
              disabled={joining || status === "loading"}
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold transition-colors"
            >
              {joining
                ? "Joining…"
                : status === "unauthenticated"
                  ? "Sign in & join"
                  : "Accept invite"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
