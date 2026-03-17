// app/auth/sign-in/page.tsx
import { SignInForm } from "@/components/auth/sign-in-form";
import Link from "next/link";
import { Music2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="rounded-lg gradient-bg p-1.5">
              <Music2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Lyrgenic</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in to continue writing
          </p>
        </div>
        <SignInForm callbackUrl={callbackUrl} />
        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href={
              callbackUrl
                ? `/auth/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/auth/sign-up"
            }
            className="text-purple-400 hover:text-purple-300"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
