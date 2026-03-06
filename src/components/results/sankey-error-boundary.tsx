"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface SankeyErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface SankeyErrorBoundaryState {
  hasError: boolean;
}

export class SankeyErrorBoundary extends Component<
  SankeyErrorBoundaryProps,
  SankeyErrorBoundaryState
> {
  constructor(props: SankeyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SankeyErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("SankeyErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>Flow visualization unavailable</span>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
