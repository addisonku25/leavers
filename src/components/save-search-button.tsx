"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { saveSearch } from "@/actions/saved-searches";
import { Button } from "@/components/ui/button";

interface SaveSearchButtonProps {
  searchId: string;
  initialSaved?: boolean;
}

export function SaveSearchButton({
  searchId,
  initialSaved = false,
}: SaveSearchButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();

  // Auto-save after signup redirect
  useEffect(() => {
    if (searchParams.get("autoSave") === "true" && session) {
      startTransition(async () => {
        await saveSearch(searchId);
        setSaved(true);
        // Remove autoSave param from URL
        const url = new URL(window.location.href);
        url.searchParams.delete("autoSave");
        router.replace(url.pathname + url.search);
      });
    }
  }, [searchParams, session, searchId, router]);

  function handleClick() {
    if (!session) {
      router.push(`/signup?returnTo=/results/${searchId}&autoSave=true`);
      return;
    }

    if (saved) return;

    startTransition(async () => {
      await saveSearch(searchId);
      setSaved(true);
    });
  }

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      onClick={handleClick}
      disabled={isPending || saved}
    >
      {isPending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="mr-2 size-4" />
      ) : (
        <Bookmark className="mr-2 size-4" />
      )}
      {saved ? "Saved" : "Save Search"}
    </Button>
  );
}
