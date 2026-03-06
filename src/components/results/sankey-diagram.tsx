"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  sankey,
  sankeyJustify,
  sankeyLinkHorizontal,
  type SankeyGraph,
  type SankeyNode as D3SankeyNode,
  type SankeyLink as D3SankeyLink,
} from "d3-sankey";
import type { SankeyData, SankeyNode, SankeyLink } from "@/lib/sankey-data";

interface SankeyDiagramProps {
  data: SankeyData;
}

type LayoutNode = D3SankeyNode<SankeyNode, SankeyLink>;
type LayoutLink = D3SankeyLink<SankeyNode, SankeyLink>;

const MARGIN = 24;
const NODE_WIDTH = 15;
const NODE_PADDING = 10;
const FIXED_HEIGHT = 400;

const CATEGORY_COLORS: Record<string, string> = {
  source: "hsl(221, 83%, 53%)",     // blue-600
  company: "hsl(215, 16%, 47%)",    // slate-500
  destination: "hsl(160, 60%, 45%)", // emerald-ish
};

function truncateLabel(text: string, maxLen = 20): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

function SankeySVG({
  data,
  width,
  height,
}: {
  data: SankeyData;
  width: number;
  height: number;
}) {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const layout = useMemo(() => {
    const generator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(NODE_WIDTH)
      .nodePadding(NODE_PADDING)
      .nodeAlign(sankeyJustify)
      .extent([
        [MARGIN, MARGIN],
        [width - MARGIN, height - MARGIN],
      ]);

    // Deep-copy data so d3-sankey can mutate without affecting React props
    const graph: SankeyGraph<SankeyNode, SankeyLink> = {
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    };

    return generator(graph);
  }, [data, width, height]);

  const linkPathGenerator = sankeyLinkHorizontal();

  const getLinkOpacity = useCallback(
    (linkIndex: number): number => {
      if (hoveredLink === null) return 0.3;
      if (linkIndex === hoveredLink) return 0.7;

      const hovered = layout.links[hoveredLink];
      const current = layout.links[linkIndex];
      if (!hovered || !current) return 0.1;

      const hoveredSourceIdx =
        typeof hovered.source === "object"
          ? (hovered.source as LayoutNode).index
          : hovered.source;
      const hoveredTargetIdx =
        typeof hovered.target === "object"
          ? (hovered.target as LayoutNode).index
          : hovered.target;
      const currentSourceIdx =
        typeof current.source === "object"
          ? (current.source as LayoutNode).index
          : current.source;
      const currentTargetIdx =
        typeof current.target === "object"
          ? (current.target as LayoutNode).index
          : current.target;

      if (
        hoveredSourceIdx === currentSourceIdx ||
        hoveredTargetIdx === currentTargetIdx
      ) {
        return 0.5;
      }

      return 0.1;
    },
    [hoveredLink, layout.links],
  );

  const handleLinkEnter = useCallback(
    (linkIndex: number, event: React.MouseEvent) => {
      setHoveredLink(linkIndex);
      const link = layout.links[linkIndex];
      if (!link) return;

      const source =
        typeof link.source === "object" ? (link.source as LayoutNode) : null;
      const target =
        typeof link.target === "object" ? (link.target as LayoutNode) : null;

      const label = [source?.name, target?.name].filter(Boolean).join(" → ");
      const count = link.value ?? 0;

      const rect = (event.currentTarget as SVGElement)
        .closest("svg")
        ?.getBoundingClientRect();
      if (rect) {
        setTooltipInfo({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 28,
          text: `${label}: ${count}`,
        });
      }
    },
    [layout.links],
  );

  const handleLinkLeave = useCallback(() => {
    setHoveredLink(null);
    setTooltipInfo(null);
  }, []);

  const getNodeColor = (node: LayoutNode): string =>
    CATEGORY_COLORS[(node as unknown as SankeyNode).category] ??
    CATEGORY_COLORS.company;

  const getLabelAnchor = (
    node: LayoutNode,
  ): { x: number; anchor: "start" | "end" | "middle" } => {
    const category = (node as unknown as SankeyNode).category;
    const x0 = node.x0 ?? 0;
    const x1 = node.x1 ?? 0;

    if (category === "source") {
      return { x: x1 + 6, anchor: "start" };
    }
    if (category === "destination") {
      return { x: x0 - 6, anchor: "end" };
    }
    // company: centered above
    return { x: (x0 + x1) / 2, anchor: "middle" };
  };

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        data-testid="sankey-svg"
        className="overflow-visible"
      >
        {/* Links */}
        <g>
          {layout.links.map((link, i) => {
            const d = linkPathGenerator(link as never);
            if (!d) return null;
            const sourceNode =
              typeof link.source === "object"
                ? (link.source as LayoutNode)
                : null;
            const strokeColor = sourceNode
              ? getNodeColor(sourceNode)
              : CATEGORY_COLORS.company;

            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={Math.max((link.width ?? 1), 1)}
                opacity={getLinkOpacity(i)}
                className="transition-opacity duration-200"
                onMouseEnter={(e) => handleLinkEnter(i, e)}
                onMouseLeave={handleLinkLeave}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {layout.nodes.map((node, i) => {
            const x0 = node.x0 ?? 0;
            const y0 = node.y0 ?? 0;
            const x1 = node.x1 ?? 0;
            const y1 = node.y1 ?? 0;
            const color = getNodeColor(node);
            const label = getLabelAnchor(node);
            const category = (node as unknown as SankeyNode).category;

            return (
              <g key={i}>
                <rect
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={Math.max(y1 - y0, 1)}
                  fill={color}
                  rx={2}
                />
                <text
                  x={label.x}
                  y={
                    category === "company"
                      ? y0 - 4
                      : (y0 + y1) / 2
                  }
                  textAnchor={label.anchor}
                  dominantBaseline={
                    category === "company" ? "auto" : "central"
                  }
                  className="fill-foreground text-xs"
                  fontSize={11}
                >
                  {truncateLabel(node.name)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltipInfo && (
        <div
          className="pointer-events-none absolute rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
          style={{
            left: tooltipInfo.x,
            top: tooltipInfo.y,
            transform: "translateX(-50%)",
          }}
        >
          {tooltipInfo.text}
        </div>
      )}
    </div>
  );
}

export function SankeyDiagram({ data }: SankeyDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (data.nodes.length === 0) return null;

  return (
    <div ref={containerRef} style={{ height: FIXED_HEIGHT }} data-testid="sankey-container">
      {width > 0 && (
        <SankeySVG data={data} width={width} height={FIXED_HEIGHT} />
      )}
    </div>
  );
}
