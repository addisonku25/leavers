"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  getLeaversForMigration,
  type AuthenticatedLeaver,
  type LeaverModalData,
  type PublicLeaver,
} from "@/actions/leavers";
import { LeaverTimeline } from "./leaver-timeline";
import { AuthGateOverlay } from "./auth-gate-overlay";

interface LeaverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  migrationId: string | null;
  role: string;
  company: string;
  count: number;
  sourceCompany: string;
  returnTo: string;
}

export function LeaverModal({
  open,
  onOpenChange,
  migrationId,
  role,
  company,
  count,
  sourceCompany,
  returnTo,
}: LeaverModalProps) {
  const [data, setData] = useState<LeaverModalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const fetchIdRef = useRef<string | null>(null);

  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.session;

  // Fetch leaver data when modal opens with a new migration
  useEffect(() => {
    if (!migrationId || !open) {
      return;
    }

    const currentId = migrationId;
    fetchIdRef.current = currentId;
    setLoading(true);
    setShowAll(false);
    setData(null);

    getLeaversForMigration(currentId).then((result) => {
      // Race condition protection: only update if this is still the current fetch
      if (fetchIdRef.current === currentId) {
        setData(result);
        setLoading(false);
      }
    });
  }, [migrationId, open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setData(null);
      setShowAll(false);
      fetchIdRef.current = null;
    }
  }, [open]);

  const leaverList = data?.leavers ?? [];
  const defaultVisible = 3;
  const hasMore = leaverList.length > defaultVisible;
  const visibleLeavers = showAll ? leaverList : leaverList.slice(0, defaultVisible);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-xl"
      >
        <DialogHeader>
          <DialogTitle>
            {role} @ {company}
          </DialogTitle>
          <DialogDescription>
            {count} {count === 1 ? "person" : "people"} made this transition
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && data && leaverList.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No individual data available for this transition
          </p>
        )}

        {!loading && data && leaverList.length > 0 && (
          <div className="space-y-6">
            {/* First leaver (always visible, possibly with blurred name) */}
            <LeaverCard
              leaver={visibleLeavers[0]}
              isAuthenticated={isAuthenticated}
              showBlurredName={!isAuthenticated}
              sourceCompany={sourceCompany}
            />

            {/* Remaining visible leavers */}
            {visibleLeavers.length > 1 && (
              <div className="relative">
                {!isAuthenticated && <AuthGateOverlay returnTo={returnTo} />}
                <div className={!isAuthenticated ? "pointer-events-none select-none" : ""}>
                  {visibleLeavers.slice(1).map((leaver) => (
                    <div key={leaver.id} className="pt-6 first:pt-0">
                      <LeaverCard
                        leaver={leaver}
                        isAuthenticated={isAuthenticated}
                        showBlurredName={false}
                        sourceCompany={sourceCompany}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show more button (only when authenticated -- unauthenticated see overlay) */}
            {hasMore && !showAll && isAuthenticated && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAll(true)}
              >
                Show {leaverList.length - defaultVisible} more
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LeaverCard({
  leaver,
  isAuthenticated,
  showBlurredName,
  sourceCompany,
}: {
  leaver: PublicLeaver | AuthenticatedLeaver;
  isAuthenticated: boolean;
  showBlurredName: boolean;
  sourceCompany: string;
}) {
  const hasName = "name" in leaver;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {isAuthenticated && hasName ? (
            <p className="text-base font-semibold truncate">
              {(leaver as AuthenticatedLeaver).name}
            </p>
          ) : showBlurredName ? (
            <p className="text-base font-semibold">
              <span className="blur-sm select-none">Full Name Available</span>
            </p>
          ) : null}
        </div>
        {isAuthenticated && hasName && (leaver as AuthenticatedLeaver).linkedinUrl && (
          <a
            href={(leaver as AuthenticatedLeaver).linkedinUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 shrink-0 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            LinkedIn
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
      <LeaverTimeline positions={leaver.positions} sourceCompany={sourceCompany} />
    </div>
  );
}
