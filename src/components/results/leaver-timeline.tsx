import type { LeaverPositionData } from "@/actions/leavers";
import { cn } from "@/lib/utils";

interface LeaverTimelineProps {
  positions: LeaverPositionData[];
}

export function LeaverTimeline({ positions }: LeaverTimelineProps) {
  if (positions.length === 0) return null;

  return (
    <div className="relative">
      {/* Connecting line */}
      {positions.length > 1 && (
        <div className="absolute left-[5px] top-[6px] bottom-[6px] w-px bg-border" />
      )}

      <div className="space-y-0">
        {positions.map((pos, index) => {
          const isCurrent = index === 0;
          const dateRange =
            pos.startDate || pos.endDate
              ? `${pos.startDate ?? "?"} - ${pos.endDate ?? "Present"}`
              : null;

          return (
            <div
              key={`${pos.company}-${pos.title}-${index}`}
              className={cn("relative pl-6", index < positions.length - 1 ? "pb-4" : "pb-0")}
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  "absolute left-0 top-[5px] size-3 rounded-full border-2",
                  isCurrent
                    ? "border-primary bg-primary"
                    : "border-muted-foreground bg-background",
                )}
              />

              {/* Content */}
              <p className="text-sm font-medium">
                {pos.title} @ {pos.company}
              </p>
              {dateRange && (
                <p className="text-xs text-muted-foreground">{dateRange}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
