import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <SearchX className="size-16 text-muted-foreground" />
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">No results found</h2>
        <p className="max-w-md text-muted-foreground">
          We couldn&apos;t find career migration data for this search. Here are
          some suggestions:
        </p>
      </div>
      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>Try a broader role title</li>
        <li>Try a larger company</li>
        <li>Try a different spelling</li>
      </ul>
      <Button asChild size="lg">
        <Link href="/">Try Another Search</Link>
      </Button>
    </div>
  );
}
