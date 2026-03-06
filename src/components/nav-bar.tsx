"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function NavBar() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    setSigningOut(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Leavers
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 sm:flex">
          {isPending ? (
            <Skeleton className="h-9 w-32" />
          ) : session?.user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <Link href="/saved">
                <Button variant="ghost" size="sm">
                  Saved
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t px-4 py-3 sm:hidden">
          {isPending ? (
            <Skeleton className="h-9 w-full" />
          ) : session?.user ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
              <Link
                href="/saved"
                className="block"
                onClick={() => setMobileOpen(false)}
              >
                <Button variant="ghost" size="sm" className="w-full">
                  Saved
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                className="block"
                onClick={() => setMobileOpen(false)}
              >
                <Button variant="ghost" size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link
                href="/signup"
                className="block"
                onClick={() => setMobileOpen(false)}
              >
                <Button size="sm" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
