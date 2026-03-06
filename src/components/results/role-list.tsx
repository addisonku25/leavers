"use client";

import { useState } from "react";
import type { SeniorityComparison } from "@/lib/seniority";
import { SeniorityDot } from "./seniority-dot";

interface RoleEntry {
  role: string;
  count: number;
  seniority: SeniorityComparison;
}

interface RoleListProps {
  roles: RoleEntry[];
  maxVisible?: number;
}

export function RoleList({ roles, maxVisible = 3 }: RoleListProps) {
  const [expanded, setExpanded] = useState(false);

  const showExpandButton = roles.length >= 5 && roles.length > maxVisible;
  const visibleRoles =
    expanded || !showExpandButton ? roles : roles.slice(0, maxVisible);
  const hiddenCount = roles.length - maxVisible;

  return (
    <div className="space-y-2">
      {visibleRoles.map((entry) => (
        <div
          key={entry.role}
          className="flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <SeniorityDot level={entry.seniority} />
            <span className="truncate text-sm">{entry.role}</span>
          </div>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {entry.count}
          </span>
        </div>
      ))}
      {showExpandButton && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          +{hiddenCount} more roles
        </button>
      )}
    </div>
  );
}
