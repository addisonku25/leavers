"use client";

import type { SeniorityComparison } from "@/lib/seniority";

interface SeniorityDotProps {
  level: SeniorityComparison;
}

const config: Record<
  SeniorityComparison,
  { color: string; label: string }
> = {
  "same-or-lower": { color: "bg-emerald-500", label: "Similar level" },
  "more-senior": { color: "bg-amber-500", label: "Had more experience" },
};

export function SeniorityDot({ level }: SeniorityDotProps) {
  const { color, label } = config[level];

  return (
    <span
      className={`inline-block size-2 shrink-0 rounded-full ${color}`}
      title={label}
      aria-label={label}
    />
  );
}
