import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchProgress } from "@/components/search-progress";

describe("SearchProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders all step names", () => {
    render(<SearchProgress />);

    expect(screen.getByText("Querying career data...")).toBeDefined();
    expect(screen.getByText("Matching role titles...")).toBeDefined();
    expect(screen.getByText("Aggregating results...")).toBeDefined();
  });

  it("shows time expectation message", () => {
    render(<SearchProgress />);

    expect(
      screen.getByText("This may take 10-20 seconds on first search."),
    ).toBeDefined();
  });

  it("shows 'taking longer than usual' after 15 seconds", () => {
    render(<SearchProgress />);

    // Initially should show normal message
    expect(
      screen.getByText("This may take 10-20 seconds on first search."),
    ).toBeDefined();

    // Advance past 15 seconds
    act(() => {
      vi.advanceTimersByTime(15500);
    });

    expect(
      screen.getByText("Taking longer than usual... hang tight."),
    ).toBeDefined();
  });
});
