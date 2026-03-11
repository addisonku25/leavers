"use client";

import { useState, useEffect, useRef } from "react";
import type { SeniorityComparison } from "@/lib/seniority";
import { cn } from "@/lib/utils";
import { SeniorityDot } from "./seniority-dot";

interface RoleEntry {
  role: string;
  count: number;
  seniority: SeniorityComparison;
}

interface RoleListProps {
  roles: RoleEntry[];
  maxVisible?: number;
  highlightedRole?: string | null;
  onRoleClick?: (role: string, migrationId: string) => void;
  migrationIds?: Map<string, string>;
}

export function RoleList({
  roles,
  maxVisible = 3,
  highlightedRole = null,
  onRoleClick,
  migrationIds,
}: RoleListProps) {
  const [expanded, setExpanded] = useState(false);
  const autoExpandedRef = useRef(false);

  const showExpandButton = roles.length >= 5 && roles.length > maxVisible;
  const visibleRoles =
    expanded || !showExpandButton ? roles : roles.slice(0, maxVisible);
  const hiddenCount = roles.length - maxVisible;

  useEffect(() => {
    if (highlightedRole) {
      // Check if highlighted role is in the hidden portion
      const isHidden =
        showExpandButton &&
        roles.slice(maxVisible).some((r) => r.role === highlightedRole);
      if (isHidden) {
        setExpanded(true);
        autoExpandedRef.current = true;
      }
    } else {
      // Clear selection: collapse only if we auto-expanded
      if (autoExpandedRef.current) {
        setExpanded(false);
        autoExpandedRef.current = false;
      }
    }
  }, [highlightedRole, roles, maxVisible, showExpandButton]);

  return (
    <div className="space-y-2">
      {visibleRoles.map((entry) => (
        <div
          key={entry.role}
          role={onRoleClick ? "button" : undefined}
          tabIndex={onRoleClick ? 0 : undefined}
          onClick={() => onRoleClick?.(entry.role, migrationIds?.get(entry.role) ?? "")}
          onKeyDown={(e) => {
            if (onRoleClick && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onRoleClick(entry.role, migrationIds?.get(entry.role) ?? "");
            }
          }}
          className={cn(
            "flex items-center justify-between gap-2",
            onRoleClick &&
              "cursor-pointer hover:underline decoration-muted-foreground/50 underline-offset-2",
            entry.role === highlightedRole &&
              "bg-blue-50 dark:bg-blue-950/30 rounded-md px-1 -mx-1 transition-colors duration-300",
          )}
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
