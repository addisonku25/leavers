"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SavedSearchCardProps {
  id: string;
  searchId: string;
  company: string;
  role: string;
  createdAt: Date;
  onDelete: (id: string) => void;
}

export function SavedSearchCard({
  id,
  searchId,
  company,
  role,
  createdAt,
  onDelete,
}: SavedSearchCardProps) {
  function handleDelete() {
    if (window.confirm("Remove this saved search?")) {
      onDelete(id);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{company}</CardTitle>
        <CardDescription>{role}</CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Delete saved search"
          >
            <Trash2 className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Saved{" "}
          {createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href={`/results/${searchId}`}>View Results</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
