import { eq } from "drizzle-orm";
import { ArrowLeft, AlertCircle, SearchX } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { migrations, searches } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";

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
      <ResultsLayout company={search.company} role={search.role}>
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
      <ResultsLayout company={search.company} role={search.role}>
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
      <ResultsLayout company={search.company} role={search.role}>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <SearchX className="size-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No results found</h2>
          <p className="max-w-md text-muted-foreground">
            We couldn't find career migration data for this search. Here are
            some suggestions:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Try a broader role title</li>
            <li>Try a larger company</li>
            <li>Try a different spelling</li>
          </ul>
          <Button asChild className="mt-2">
            <Link href="/">Try Another Search</Link>
          </Button>
        </div>
      </ResultsLayout>
    );
  }

  // Results state -- display destination companies and roles
  return (
    <ResultsLayout company={search.company} role={search.role}>
      <p className="text-sm text-muted-foreground">
        {results.length} destination{results.length === 1 ? "" : "s"} found
      </p>

      <div className="space-y-2">
        {results.map((migration) => (
          <div
            key={migration.id}
            className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="font-medium">{migration.destinationCompany}</p>
              <p className="text-sm text-muted-foreground">
                {migration.destinationRole}
              </p>
            </div>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {migration.count}
            </span>
          </div>
        ))}
      </div>
    </ResultsLayout>
  );
}

function ResultsLayout({
  company,
  role,
  children,
}: {
  company: string;
  role: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to search
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Where do {role}s go after {company}?
          </h1>
          <p className="mt-1 text-muted-foreground">
            Career migration patterns for {role} at {company}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
