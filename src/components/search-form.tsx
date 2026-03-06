"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import Link from "next/link";
import { searchSchema, type SearchInput } from "@/lib/validations/search";
import { searchAction } from "@/actions/search";
import { SearchSuggestions } from "@/components/search-suggestions";
import { SearchProgress } from "@/components/search-progress";
import { Button } from "@/components/ui/button";
import companies from "@/data/companies.json";
import roles from "@/data/roles.json";

type RateLimitError = {
  type: "rate_limited_guest" | "rate_limited_auth";
  resetAt: number;
};

export function SearchForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<RateLimitError | null>(
    null,
  );

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      company: "",
      role: "",
    },
  });

  const companyValue = watch("company");
  const roleValue = watch("role");

  const onSubmit = handleSubmit((data) => {
    setServerError(null);
    setRateLimitError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("company", data.company);
      formData.set("role", data.role);
      const result = await searchAction(formData);
      if (result && "error" in result) {
        if (
          result.error === "rate_limited_guest" ||
          result.error === "rate_limited_auth"
        ) {
          setRateLimitError({
            type: result.error,
            resetAt: (result as { error: string; resetAt: number }).resetAt,
          });
        } else {
          setServerError(
            typeof result.error === "string"
              ? result.error
              : "Validation failed. Please check your inputs.",
          );
        }
      } else if (result?.searchId) {
        router.push(`/results/${result.searchId}`);
      }
    });
  });

  if (isPending) {
    return <SearchProgress />;
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-lg space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="company"
          className="text-sm font-medium leading-none"
        >
          Company
        </label>
        <SearchSuggestions
          id="company"
          name="company"
          suggestions={companies}
          value={companyValue}
          onChange={(val) => {
            setValue("company", val, { shouldValidate: !!errors.company });
          }}
          placeholder="e.g. Google, McKinsey, Goldman Sachs"
          error={errors.company?.message}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="role"
          className="text-sm font-medium leading-none"
        >
          Role
        </label>
        <SearchSuggestions
          id="role"
          name="role"
          suggestions={roles}
          value={roleValue}
          onChange={(val) => {
            setValue("role", val, { shouldValidate: !!errors.role });
          }}
          placeholder="e.g. Software Engineer, Product Manager"
          error={errors.role?.message}
        />
      </div>

      {rateLimitError?.type === "rate_limited_guest" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <p>
            You&apos;ve used your 3 daily searches.{" "}
            <Link href="/signup" className="font-medium underline">
              Sign up for free
            </Link>{" "}
            to get 50 searches per hour.
          </p>
        </div>
      )}

      {rateLimitError?.type === "rate_limited_auth" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <p>
            Slow down -- try again in{" "}
            {Math.max(
              1,
              Math.ceil((rateLimitError.resetAt - Date.now()) / 60000),
            )}{" "}
            minutes.
          </p>
        </div>
      )}

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full cursor-pointer"
        disabled={isPending}
      >
        <Search className="size-4" />
        Search
      </Button>
    </form>
  );
}
