import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SankeyDiagram } from "../results/sankey-diagram";
import { SankeyErrorBoundary } from "../results/sankey-error-boundary";
import { DrillDownProvider } from "../results/drill-down-provider";
import type { SankeyData } from "@/lib/sankey-data";

// Mock ResizeObserver for jsdom
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    // Fire immediately with a mocked width
    this.callback(
      [
        {
          contentRect: { width: 800, height: 400 } as DOMRectReadOnly,
          target,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this,
    );
  }
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver =
  MockResizeObserver as unknown as typeof ResizeObserver;

const validData: SankeyData = {
  nodes: [
    { name: "Software Engineer", category: "source" },
    { name: "Google", category: "company" },
    { name: "Meta", category: "company" },
    { name: "Senior Engineer", category: "destination" },
    { name: "Staff Engineer", category: "destination" },
  ],
  links: [
    { source: 0, target: 1, value: 10 },
    { source: 0, target: 2, value: 5 },
    { source: 1, target: 3, value: 7 },
    { source: 1, target: 4, value: 3 },
    { source: 2, target: 3, value: 5 },
  ],
};

const emptyData: SankeyData = {
  nodes: [],
  links: [],
};

describe("SankeyDiagram", () => {
  it("renders an SVG element when given valid data", () => {
    render(<DrillDownProvider><SankeyDiagram data={validData} /></DrillDownProvider>);
    const svg = screen.getByTestId("sankey-svg");
    expect(svg).toBeDefined();
    expect(svg.tagName).toBe("svg");
  });

  it("returns null when data.nodes is empty", () => {
    const { container } = render(<SankeyDiagram data={emptyData} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders node labels", () => {
    render(<DrillDownProvider><SankeyDiagram data={validData} /></DrillDownProvider>);
    expect(screen.getByText("Software Engineer")).toBeDefined();
    expect(screen.getByText("Google")).toBeDefined();
    expect(screen.getByText("Meta")).toBeDefined();
  });
});

describe("SankeyErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <SankeyErrorBoundary>
        <div data-testid="child">Hello</div>
      </SankeyErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("renders fallback when child throws", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function ThrowingChild() {
      throw new Error("Test error");
      return null;
    }

    render(
      <SankeyErrorBoundary
        fallback={<div data-testid="fallback">Fallback</div>}
      >
        <ThrowingChild />
      </SankeyErrorBoundary>,
    );

    expect(screen.getByTestId("fallback")).toBeDefined();
    consoleSpy.mockRestore();
  });

  it("renders default fallback message when no custom fallback provided", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function ThrowingChild() {
      throw new Error("Test error");
      return null;
    }

    render(
      <SankeyErrorBoundary>
        <ThrowingChild />
      </SankeyErrorBoundary>,
    );

    expect(screen.getByText("Flow visualization unavailable")).toBeDefined();
    consoleSpy.mockRestore();
  });
});
