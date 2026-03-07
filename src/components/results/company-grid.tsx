"use client";

import { useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CompanyCardData } from "@/lib/sankey-data";
import type { DrillDownState } from "./drill-down-provider";
import { useDrillDown } from "./drill-down-provider";
import { CompanyCard } from "./company-card";

interface CompanyGridProps {
  companies: CompanyCardData[];
}

export interface ReorderedCard {
  company: CompanyCardData;
  isPromoted: boolean;
  isDimmed: boolean;
}

export function reorderCards(
  companies: CompanyCardData[],
  selection: DrillDownState,
): ReorderedCard[] {
  if (selection.type === null) {
    return companies.map((c) => ({
      company: c,
      isPromoted: false,
      isDimmed: false,
    }));
  }

  if (selection.type === "company") {
    const promoted = companies.filter(
      (c) => c.company === selection.value,
    );
    const rest = companies.filter(
      (c) => c.company !== selection.value,
    );

    // Graceful fallback: no match means no dimming
    if (promoted.length === 0) {
      return companies.map((c) => ({
        company: c,
        isPromoted: false,
        isDimmed: false,
      }));
    }

    return [
      ...promoted.map((c) => ({ company: c, isPromoted: true, isDimmed: false })),
      ...rest.map((c) => ({ company: c, isPromoted: false, isDimmed: true })),
    ];
  }

  // selection.type === "role"
  const matching: { company: CompanyCardData; matchCount: number }[] = [];
  const nonMatching: CompanyCardData[] = [];

  for (const c of companies) {
    const matchingRole = c.roles.find((r) => r.role === selection.value);
    if (matchingRole) {
      matching.push({ company: c, matchCount: matchingRole.count });
    } else {
      nonMatching.push(c);
    }
  }

  // Graceful fallback: no match means no dimming
  if (matching.length === 0) {
    return companies.map((c) => ({
      company: c,
      isPromoted: false,
      isDimmed: false,
    }));
  }

  // Sort promoted cards by matching role count descending
  matching.sort((a, b) => b.matchCount - a.matchCount);

  return [
    ...matching.map((m) => ({
      company: m.company,
      isPromoted: true,
      isDimmed: false,
    })),
    ...nonMatching.map((c) => ({
      company: c,
      isPromoted: false,
      isDimmed: true,
    })),
  ];
}

export function CompanyGrid({ companies }: CompanyGridProps) {
  const { state } = useDrillDown();
  const sectionRef = useRef<HTMLDivElement>(null);
  const prevTypeRef = useRef<typeof state.type>(null);

  const orderedCards = useMemo(
    () => reorderCards(companies, state),
    [companies, state],
  );

  const highlightedRole = state.type === "role" ? state.value : null;

  useEffect(() => {
    // Scroll to section when selection goes from null to non-null
    if (prevTypeRef.current === null && state.type !== null) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevTypeRef.current = state.type;
  }, [state.type]);

  return (
    <div>
      <h2
        ref={sectionRef}
        className="mb-4 text-lg font-semibold tracking-tight"
      >
        Where they went
      </h2>
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orderedCards.map(({ company, isPromoted, isDimmed }) => (
            <motion.div
              key={company.company}
              layout
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <CompanyCard
                data={company}
                isPromoted={isPromoted}
                isDimmed={isDimmed}
                highlightedRole={highlightedRole}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
