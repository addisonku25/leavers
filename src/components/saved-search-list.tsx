"use client";

import { useState, useTransition } from "react";
import { deleteSavedSearch } from "@/actions/saved-searches";
import { SavedSearchCard } from "@/components/saved-search-card";

interface SavedSearch {
  id: string;
  searchId: string;
  company: string;
  role: string;
  createdAt: Date;
}

interface SavedSearchListProps {
  initialSearches: SavedSearch[];
}

export function SavedSearchList({ initialSearches }: SavedSearchListProps) {
  const [searches, setSearches] = useState(initialSearches);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    // Optimistic update: remove from local state immediately
    setSearches((prev) => prev.filter((s) => s.id !== id));

    startTransition(async () => {
      await deleteSavedSearch(id);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {searches.map((search) => (
        <SavedSearchCard
          key={search.id}
          id={search.id}
          searchId={search.searchId}
          company={search.company}
          role={search.role}
          createdAt={search.createdAt}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
