import type { CompanyCardData } from "@/lib/sankey-data";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { RoleList } from "./role-list";

interface CompanyCardProps {
  data: CompanyCardData;
  isPromoted?: boolean;
  isDimmed?: boolean;
  highlightedRole?: string | null;
}

export function CompanyCard({
  data,
  isPromoted = false,
  isDimmed = false,
  highlightedRole = null,
}: CompanyCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-400",
        isPromoted && "ring-2 ring-blue-500 shadow-md",
        isDimmed && "opacity-50",
      )}
    >
      <CardHeader>
        <CardTitle>{data.company}</CardTitle>
        <CardAction>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {data.totalCount}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <RoleList roles={data.roles} highlightedRole={highlightedRole} />
      </CardContent>
    </Card>
  );
}
