// components/navbar.tsx – Top navigation bar
"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";

/** Custom logo: a music note whose stem flows into a "C" */
function LyrgenicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Note head */}
      <ellipse
        cx="6.5"
        cy="18"
        rx="2.5"
        ry="1.8"
        fill="currentColor"
        stroke="none"
      />
      {/* Stem going up */}
      <line x1="9" y1="18" x2="9" y2="6" />
      {/* Flag on stem top */}
      <path d="M9 6 C14 7, 14 11, 10 12" />
      {/* Continuation: stem end curves into a C shape */}
      <path d="M9 18 C9 19.2, 9.6 20.5, 11 21.2 C13 22.2, 16 21.8, 17.5 20 C18.5 18.8, 18.5 17, 17 16" />
    </svg>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg gradient-bg p-1.5">
            <LyrgenicIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">Lyrgenic</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <span className="text-purple-400 font-medium">Free</span>
          {session && (
            <Link
              href="/app"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth actions + theme toggle */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <>
              <span className="text-sm text-muted-foreground">
                {session.user?.name ?? session.user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">Get started free</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          <span className="block text-purple-400 font-medium py-1">
            Free forever
          </span>
          {session ? (
            <>
              <Link
                href="/app"
                className="block text-foreground/70 hover:text-foreground py-1"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="block text-foreground/70 hover:text-foreground py-1"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="block text-foreground/70 hover:text-foreground py-1"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="block text-purple-400 font-medium hover:text-purple-300 py-1"
                onClick={() => setOpen(false)}
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
