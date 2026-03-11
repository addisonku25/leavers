import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthGateOverlayProps {
  returnTo: string;
}

export function AuthGateOverlay({ returnTo }: AuthGateOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur-md bg-background/60">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <Lock className="size-8 text-muted-foreground" />
        <h3 className="text-base font-semibold">Sign up to see all profiles</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Create a free account to view full career histories, names, and LinkedIn profiles for
          everyone who made this transition.
        </p>
        <Button asChild>
          <Link href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}>
            Sign up free
          </Link>
        </Button>
      </div>
    </div>
  );
}
