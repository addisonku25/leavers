"use server";

import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { migrations as migrationsTable, searches } from "@/lib/db/schema";
import { searchSchema } from "@/lib/validations/search";
import { buildCacheKey, getCachedOrFetch } from "@/lib/cache/cache-manager";
import { getProvider } from "@/lib/data/provider-factory";
import { auth } from "@/lib/auth";
import {
  searchGuestLimiter,
  searchAuthLimiter,
} from "@/lib/rate-limit";

const CACHE_TTL_DAYS = 30;

export async function searchAction(formData: FormData) {
  // Rate limit check before any processing
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  const limiter = session ? searchAuthLimiter : searchGuestLimiter;
  const identifier = session
    ? session.user.id
    : (reqHeaders.get("x-forwarded-for") ?? "anonymous");

  if (limiter) {
    const { success, reset } = await limiter.limit(identifier);
    if (!success) {
      if (session) {
        return { error: "rate_limited_auth" as const, resetAt: reset };
      }
      return { error: "rate_limited_guest" as const, resetAt: reset };
    }
  }

  // Validate input
  const parsed = searchSchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { company, role } = parsed.data;
  const cacheKey = buildCacheKey({ company, role });
  const now = new Date();

  // Reuse existing non-expired search if available
  const existing = await db
    .select()
    .from(searches)
    .where(eq(searches.cacheKey, cacheKey))
    .limit(1);

  if (existing.length > 0 && existing[0].status === "complete" && existing[0].expiresAt > now) {
    return { searchId: existing[0].id };
  }

  // Delete stale entry if expired or errored, so we can re-insert with same cache key
  if (existing.length > 0) {
    await db.delete(migrationsTable).where(eq(migrationsTable.searchId, existing[0].id));
    await db.delete(searches).where(eq(searches.id, existing[0].id));
  }

  const searchId = nanoid();
  const provider = getProvider();
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
          sourceRole: migration.sourceRole,
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
