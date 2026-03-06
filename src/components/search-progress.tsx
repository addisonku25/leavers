"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STEPS = [
  { label: "Querying career data...", durationMs: 3000 },
  { label: "Matching role titles...", durationMs: 4000 },
  { label: "Aggregating results...", durationMs: 5000 },
];

export function SearchProgress() {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs((prev) => prev + 500);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Advance steps based on cumulative time
  useEffect(() => {
    let cumulative = 0;
    for (let i = 0; i < STEPS.length; i++) {
      cumulative += STEPS[i].durationMs;
      if (elapsedMs < cumulative) {
        setCurrentStep(i);
        return;
      }
    }
    // If we've passed all steps, stay on the last one
    setCurrentStep(STEPS.length - 1);
  }, [elapsedMs]);

  // Show "taking longer than usual" after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 py-8">
      <div className="w-full space-y-3">
        {STEPS.map((step, index) => {
          const isComplete = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div
              key={step.label}
              className="flex items-center gap-3 transition-opacity duration-300"
              style={{ opacity: isPending ? 0.4 : 1 }}
            >
              {isComplete ? (
                <CheckCircle2 className="size-5 text-primary" />
              ) : isActive ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <Circle className="size-5 text-muted-foreground/40" />
              )}
              <span
                className={
                  isComplete || isActive
                    ? "text-sm font-medium text-foreground"
                    : "text-sm text-muted-foreground"
                }
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {showSlowMessage
          ? "Taking longer than usual... hang tight."
          : "This may take 10-20 seconds on first search."}
      </p>
    </div>
  );
}
