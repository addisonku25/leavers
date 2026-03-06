"use server";

import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { migrations as migrationsTable, searches } from "@/lib/db/schema";
import { searchSchema } from "@/lib/validations/search";
import { buildCacheKey, getCachedOrFetch } from "@/lib/cache/cache-manager";
import { getProvider } from "@/lib/data/provider-factory";

const CACHE_TTL_DAYS = 30;

export async function searchAction(formData: FormData) {
  // Validate input
  const parsed = searchSchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { company, role } = parsed.data;
  const searchId = nanoid();
  const cacheKey = buildCacheKey({ company, role });
  const provider = getProvider();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Create search record with "pending" status
  await db.insert(searches).values({
    id: searchId,
    company,
    role,
    cacheKey,
    provider: provider.name,
    resultCount: 0,
    status: "pending",
    createdAt: now,
    expiresAt,
  });

  try {
    // Fetch data through cache-aside pipeline
    const results = await getCachedOrFetch({ company, role }, provider);

    // Store migration results linked to this search
    if (results.length > 0) {
      for (const migration of results) {
        await db.insert(migrationsTable).values({
          id: nanoid(),
          searchId,
          destinationCompany: migration.destinationCompany,
          destinationRole: migration.destinationRole,
          count: migration.count,
        });
      }
    }

    // Update search to "complete"
    await db
      .update(searches)
      .set({
        status: "complete",
        resultCount: results.length,
      })
      .where(eq(searches.id, searchId));

    return { searchId };
  } catch (error: unknown) {
    // Update search to "error"
    await db
      .update(searches)
      .set({ status: "error" })
      .where(eq(searches.id, searchId));

    return { error: "Failed to fetch data. Please try again." };
  }
}
