import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "@/components/results/empty-state";

describe("EmptyState", () => {
  it("renders the 'Try Another Search' CTA button", () => {
    render(<EmptyState />);

    const cta = screen.getByRole("link", { name: /try another search/i });
    expect(cta).toBeDefined();
    expect(cta.getAttribute("href")).toBe("/");
  });

  it("renders suggestion text", () => {
    render(<EmptyState />);

    expect(screen.getByText(/try a broader role/i)).toBeDefined();
    expect(screen.getByText(/try a larger company/i)).toBeDefined();
    expect(screen.getByText(/try a different spelling/i)).toBeDefined();
  });

  it("renders the Lucide SearchX icon (SVG element)", () => {
    const { container } = render(<EmptyState />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("renders the 'No results found' heading", () => {
    render(<EmptyState />);

    expect(
      screen.getByRole("heading", { name: /no results found/i }),
    ).toBeDefined();
  });
});
