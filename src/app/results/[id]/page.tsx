import { eq } from "drizzle-orm";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { migrations, searches } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import { EmptyState } from "@/components/results/empty-state";

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;

  // Load search record
  const search = await db.query.searches.findFirst({
    where: eq(searches.id, id),
  });

  if (!search) {
    notFound();
  }

  // Error state
  if (search.status === "error") {
    return (
      <ResultsLayout>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="size-12 text-destructive" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="max-w-md text-muted-foreground">
            Something went wrong fetching data. Please try again in a moment.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/">Try Another Search</Link>
            </Button>
          </div>
        </div>
      </ResultsLayout>
    );
  }

  // Pending state -- per Option A, this should rarely happen since the server
  // action completes before redirecting. But handle gracefully just in case.
  if (search.status === "pending") {
    return (
      <ResultsLayout>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">
            This search is still processing. Please wait a moment and refresh.
          </p>
          <Button asChild variant="outline">
            <Link href={`/results/${id}`}>Refresh</Link>
          </Button>
        </div>
      </ResultsLayout>
    );
  }

  // Load migration results
  const results = await db.query.migrations.findMany({
    where: eq(migrations.searchId, id),
  });

  // Empty results state
  if (results.length === 0) {
    return (
      <ResultsLayout>
        <EmptyState />
      </ResultsLayout>
    );
  }

  // Results state -- display grouped company cards with role breakdowns
  const migrationData = results.map((r) => ({
    destinationCompany: r.destinationCompany,
    destinationRole: r.destinationRole,
    sourceRole: r.sourceRole,
    count: r.count,
  }));

  return (
    <ResultsLayout>
      <ResultsDashboard
        search={{ company: search.company, role: search.role }}
        migrations={migrationData}
      />
    </ResultsLayout>
  );
}

function ResultsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-16">
      <div className="w-full max-w-6xl space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to search
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
