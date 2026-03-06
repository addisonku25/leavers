import type { CompanyCardData } from "@/lib/sankey-data";
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
}

export function CompanyCard({ data }: CompanyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.company}</CardTitle>
        <CardAction>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {data.totalCount}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <RoleList roles={data.roles} />
      </CardContent>
    </Card>
  );
}
