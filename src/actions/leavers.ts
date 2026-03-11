"use server";

import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leavers, leaverPositions } from "@/lib/db/schema";

/** Position data (always visible). */
export interface LeaverPositionData {
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
}

/** Leaver data visible to all users (no PII). */
export interface PublicLeaver {
  id: string;
  currentTitle: string | null;
  currentCompany: string | null;
  transitionDate: string | null;
  positions: LeaverPositionData[];
}

/** Leaver data visible to authenticated users (includes PII). */
export interface AuthenticatedLeaver extends PublicLeaver {
  name: string;
  linkedinUrl: string | null;
}

/** Response shape for the leaver modal data. */
export interface LeaverModalData {
  isAuthenticated: boolean;
  leavers: PublicLeaver[] | AuthenticatedLeaver[];
  totalCount: number;
}

/**
 * Fetch leavers for a given migration ID.
 * PII (name, linkedinUrl) is only included when the user has an active session.
 */
export async function getLeaversForMigration(
  migrationId: string,
): Promise<LeaverModalData> {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = !!session;

  let leaverRows: (typeof leavers.$inferSelect)[];
  try {
    leaverRows = await db.query.leavers.findMany({
      where: eq(leavers.migrationId, migrationId),
    });
  } catch {
    // Table may not exist yet in local dev
    return { isAuthenticated, leavers: [], totalCount: 0 };
  }

  // Build leaver objects with positions
  const result: (PublicLeaver | AuthenticatedLeaver)[] = [];

  for (const row of leaverRows) {
    const positionRows = await db.query.leaverPositions.findMany({
      where: eq(leaverPositions.leaverId, row.id),
      orderBy: [asc(leaverPositions.sortOrder)],
    });

    const positions: LeaverPositionData[] = positionRows.map((p) => ({
      company: p.company,
      title: p.title,
      startDate: p.startDate,
      endDate: p.endDate,
    }));

    if (isAuthenticated) {
      result.push({
        id: row.id,
        name: row.name,
        linkedinUrl: row.linkedinUrl,
        currentTitle: row.currentTitle,
        currentCompany: row.currentCompany,
        transitionDate: row.transitionDate,
        positions,
      } satisfies AuthenticatedLeaver);
    } else {
      result.push({
        id: row.id,
        currentTitle: row.currentTitle,
        currentCompany: row.currentCompany,
        transitionDate: row.transitionDate,
        positions,
      } satisfies PublicLeaver);
    }
  }

  return {
    isAuthenticated,
    leavers: result,
    totalCount: leaverRows.length,
  };
}
