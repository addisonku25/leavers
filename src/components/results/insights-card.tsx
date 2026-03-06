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
    <Card>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
        <CardDescription>
          {isLimitedData
            ? "Based on limited data -- patterns may not be representative"
            : `Key patterns from ${totalMigrations} career transitions`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section 1: Top Destinations */}
        {topDestinations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Top Destinations</h3>
            <ol className="space-y-1.5">
              {topDestinations.map((dest, i) => (
                <li key={dest.company} className="flex items-baseline gap-2 text-sm">
                  <span className="text-muted-foreground w-5 text-right shrink-0">
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
            <h3 className="text-sm font-medium mb-3">Career Paths</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roleBuckets.map((bucket) => (
                <div
                  key={bucket.category}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-medium">{bucket.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {bucket.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
            <h3 className="text-sm font-medium mb-2">Pattern Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {patternSummary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
