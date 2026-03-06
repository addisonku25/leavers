"use client";

import type { InsightsData } from "@/lib/insights";
import { MIN_MEANINGFUL_MIGRATIONS } from "@/lib/insights";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface InsightsCardProps {
  insights: InsightsData;
}

export function InsightsCard({ insights }: InsightsCardProps) {
  const {
    topDestinations,
    roleBuckets,
    patternSummary,
    totalMigrations,
  } = insights;

  const isLimitedData = totalMigrations < MIN_MEANINGFUL_MIGRATIONS;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="gap-1 px-4 pb-0">
        <CardTitle className="text-sm">Insights</CardTitle>
        <CardDescription className="text-xs">
          {isLimitedData
            ? "Based on limited data -- patterns may not be representative"
            : `Key patterns from ${totalMigrations} career transitions`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 px-4">
        {/* Section 1: Top Destinations */}
        {topDestinations.length > 0 && (
          <div>
            <h3 className="text-xs font-medium mb-1.5">Top Destinations</h3>
            <ol className="space-y-0.5">
              {topDestinations.map((dest, i) => (
                <li key={dest.company} className="flex items-baseline gap-1.5 text-xs">
                  <span className="text-muted-foreground w-4 text-right shrink-0">
                    {i + 1}.
                  </span>
                  <span className="font-medium">{dest.company}</span>
                  <span className="text-muted-foreground">&mdash; {dest.percentage}%</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Divider between sections */}
        {topDestinations.length > 0 && roleBuckets.length > 0 && (
          <div className="border-b" />
        )}

        {/* Section 2: Career Paths */}
        {roleBuckets.length > 0 && (
          <div>
            <h3 className="text-xs font-medium mb-1.5">Career Paths</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {roleBuckets.map((bucket) => (
                <div
                  key={bucket.category}
                  className="rounded-md border px-2.5 py-1.5"
                >
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-xs font-medium">{bucket.category}</span>
                    <span className="text-xs text-muted-foreground">
                      {bucket.percentage}%
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {bucket.topRoles.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider before pattern summary */}
        {patternSummary &&
          (topDestinations.length > 0 || roleBuckets.length > 0) && (
            <div className="border-b" />
          )}

        {/* Section 3: Pattern Summary */}
        {patternSummary && (
          <div>
            <h3 className="text-xs font-medium mb-1">Pattern Summary</h3>
            <p className="text-xs text-muted-foreground leading-snug">
              {patternSummary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
