import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSavedSearches } from "@/actions/saved-searches";
import { SavedSearchList } from "@/components/saved-search-list";

export const metadata: Metadata = {
  title: "Saved Searches | Leavers",
};

export default async function SavedPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?returnTo=/saved");
  }

  const savedSearches = await getSavedSearches();

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-16">
      <div className="w-full max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Saved Searches</h1>

        {savedSearches.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              You haven&apos;t saved any searches yet. Search for career
              migrations and save the ones you want to track.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium underline underline-offset-4 hover:text-foreground"
            >
              Start a search
            </Link>
          </div>
        ) : (
          <SavedSearchList initialSearches={savedSearches} />
        )}
      </div>
    </div>
  );
}
