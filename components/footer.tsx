// components/footer.tsx
import Link from "next/link";
import { Music2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg gradient-bg p-1.5">
                <Music2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold gradient-text">
                Lyrgenic
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI-powered lyric generation for artists and producers.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Product</p>
              <nav className="flex flex-col gap-2 text-muted-foreground">
                <Link
                  href="/pricing"
                  className="hover:text-foreground transition-colors"
                >
                  Free
                </Link>
                <Link
                  href="/app"
                  className="hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Account</p>
              <nav className="flex flex-col gap-2 text-muted-foreground">
                <Link
                  href="/auth/sign-in"
                  className="hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="hover:text-foreground transition-colors"
                >
                  Sign up
                </Link>
              </nav>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Legal</p>
              <nav className="flex flex-col gap-2 text-muted-foreground">
                <Link
                  href="/legal/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/legal/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} Lyrgenic. All rights reserved. Generated
          lyrics are AI-created originals.
        </div>
      </div>
    </footer>
  );
}
