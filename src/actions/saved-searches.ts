"use server";

import { nanoid } from "nanoid";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedSearches, searches } from "@/lib/db/schema";

export async function saveSearch(searchId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "unauthorized" };
  }

  // Idempotent: if already saved, return success
  const existing = await db.query.savedSearches.findFirst({
    where: and(
      eq(savedSearches.userId, session.user.id),
      eq(savedSearches.searchId, searchId),
    ),
  });

  if (existing) {
    return { success: true };
  }

  await db.insert(savedSearches).values({
    id: nanoid(),
    userId: session.user.id,
    searchId,
    createdAt: new Date(),
  });

  return { success: true };
}

export async function deleteSavedSearch(savedSearchId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "unauthorized" };
  }

  // Ownership check: only delete if belongs to current user
  await db
    .delete(savedSearches)
    .where(
      and(
        eq(savedSearches.id, savedSearchId),
        eq(savedSearches.userId, session.user.id),
      ),
    );

  return { success: true };
}

export async function getSavedSearches() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return [];
  }

  const results = await db
    .select({
      id: savedSearches.id,
      searchId: savedSearches.searchId,
      company: searches.company,
      role: searches.role,
      createdAt: savedSearches.createdAt,
    })
    .from(savedSearches)
    .innerJoin(searches, eq(savedSearches.searchId, searches.id))
    .where(eq(savedSearches.userId, session.user.id))
    .orderBy(desc(savedSearches.createdAt));

  return results;
}

export async function isSearchSaved(searchId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { saved: false };
  }

  const existing = await db.query.savedSearches.findFirst({
    where: and(
      eq(savedSearches.userId, session.user.id),
      eq(savedSearches.searchId, searchId),
    ),
  });

  return { saved: !!existing };
}
