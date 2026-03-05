// app/auth/sign-up/page.tsx
import { SignUpForm } from "@/components/auth/sign-up-form";
import Link from "next/link";
import { Music2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            5 free generations every day
          </p>
        </div>
        <SignUpForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/sign-in"
            className="text-purple-400 hover:text-purple-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
