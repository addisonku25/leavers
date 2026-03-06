"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { searchSchema, type SearchInput } from "@/lib/validations/search";
import { searchAction } from "@/actions/search";
import { SearchSuggestions } from "@/components/search-suggestions";
import { SearchProgress } from "@/components/search-progress";
import { Button } from "@/components/ui/button";
import companies from "@/data/companies.json";
import roles from "@/data/roles.json";

export function SearchForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

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
    startTransition(async () => {
      const formData = new FormData();
      formData.set("company", data.company);
      formData.set("role", data.role);
      const result = await searchAction(formData);
      if (result?.error) {
        setServerError(
          typeof result.error === "string"
            ? result.error
            : "Validation failed. Please check your inputs.",
        );
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
