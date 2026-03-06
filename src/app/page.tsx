import { SearchForm } from "@/components/search-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <main className="flex w-full max-w-2xl flex-col items-center gap-10">
        {/* Hero section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Where do people go{" "}
            <span className="bg-linear-to-r from-primary/80 to-primary bg-clip-text text-transparent">
              after they leave?
            </span>
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            See real career migration patterns. Search any company and role to
            discover where professionals end up next.
          </p>
        </div>

        {/* Search form */}
        <SearchForm />
      </main>
    </div>
  );
}
