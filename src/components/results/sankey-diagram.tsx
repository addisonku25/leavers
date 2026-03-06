"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
  sourceCompany?: string;
}

type LayoutNode = D3SankeyNode<SankeyNode, SankeyLink>;
type LayoutLink = D3SankeyLink<SankeyNode, SankeyLink>;

const MARGIN = 16;
const NODE_WIDTH = 15;
const NODE_PADDING = 18;
const FIXED_HEIGHT = 500;

const CATEGORY_COLORS: Record<string, string> = {
  source: "hsl(221, 83%, 53%)",     // blue-600
  company: "hsl(215, 16%, 47%)",    // slate-500
  destination: "hsl(160, 60%, 45%)", // emerald-ish
};

function truncateLabel(text: string, maxLen = 24): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

function SankeySVG({
  data,
  width,
  height,
  sourceCompany,
}: {
  data: SankeyData;
  width: number;
  height: number;
  sourceCompany?: string;
}) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const layout = useMemo(() => {
    const generator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(NODE_WIDTH)
      .nodePadding(NODE_PADDING)
      .nodeAlign(sankeyJustify)
      .nodeSort((a, b) => {
        const catA = (a as unknown as SankeyNode).category;
        const catB = (b as unknown as SankeyNode).category;
        if (catA !== catB) return 0; // don't cross-sort categories
        if (catA === "source") return 0;
        const nameA = (a as unknown as SankeyNode).name;
        const nameB = (b as unknown as SankeyNode).name;
        // "Other" variants always last
        const aIsOther = nameA.startsWith("Other");
        const bIsOther = nameB.startsWith("Other");
        if (aIsOther !== bIsOther) return aIsOther ? 1 : -1;
        return nameA.localeCompare(nameB);
      })
      .extent([
        [MARGIN + 140, MARGIN],
        [width - MARGIN - 140, height - MARGIN],
      ]);

    // Deep-copy data so d3-sankey can mutate without affecting React props
    const graph: SankeyGraph<SankeyNode, SankeyLink> = {
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    };

    return generator(graph);
  }, [data, width, height]);

  const linkPathGenerator = sankeyLinkHorizontal();

  // Build set of node indices connected to the hovered node
  const connectedNodes = useMemo(() => {
    if (hoveredNode === null) return null;
    const connected = new Set<number>([hoveredNode]);
    for (const link of layout.links) {
      const srcIdx = typeof link.source === "object" ? (link.source as LayoutNode).index! : link.source;
      const tgtIdx = typeof link.target === "object" ? (link.target as LayoutNode).index! : link.target;
      if (srcIdx === hoveredNode || tgtIdx === hoveredNode) {
        connected.add(srcIdx);
        connected.add(tgtIdx);
      }
    }
    return connected;
  }, [hoveredNode, layout.links]);

  const getLinkOpacity = useCallback(
    (link: (typeof layout.links)[number]): number => {
      if (hoveredNode === null) return 0.3;
      const srcIdx = typeof link.source === "object" ? (link.source as LayoutNode).index! : link.source;
      const tgtIdx = typeof link.target === "object" ? (link.target as LayoutNode).index! : link.target;
      if (srcIdx === hoveredNode || tgtIdx === hoveredNode) return 0.7;
      return 0.08;
    },
    [hoveredNode],
  );

  const getNodeOpacity = useCallback(
    (nodeIndex: number): number => {
      if (connectedNodes === null) return 1;
      return connectedNodes.has(nodeIndex) ? 1 : 0.2;
    },
    [connectedNodes],
  );

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
      return { x: x0 - 6, anchor: "end" };
    }
    if (category === "destination") {
      return { x: x1 + 6, anchor: "start" };
    }
    // company: centered above
    return { x: (x0 + x1) / 2, anchor: "middle" };
  };

  return (
    <svg
      width={width}
      height={height}
      data-testid="sankey-svg"
      className="overflow-visible"
      onMouseLeave={() => setHoveredNode(null)}
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
              opacity={getLinkOpacity(link)}
              className="pointer-events-none transition-opacity duration-200"
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
          const nodeOpacity = getNodeOpacity(i);

          return (
            <g
              key={i}
              opacity={nodeOpacity}
              className="cursor-pointer transition-opacity duration-200"
              onMouseEnter={() => setHoveredNode(i)}
            >
              <rect
                x={x0}
                y={y0}
                width={x1 - x0}
                height={Math.max(y1 - y0, 1)}
                fill={color}
                rx={2}
              />
              {/* Invisible wider hit area for easier hover */}
              <rect
                x={x0 - 4}
                y={y0 - 2}
                width={x1 - x0 + 8}
                height={Math.max(y1 - y0, 1) + 4}
                fill="transparent"
              />
              {category === "source" && sourceCompany ? (
                <>
                  <text
                    x={label.x}
                    y={(y0 + y1) / 2 - 8}
                    textAnchor={label.anchor}
                    dominantBaseline="central"
                    className="fill-foreground font-semibold text-xs"
                    fontSize={11}
                  >
                    {truncateLabel(sourceCompany)}
                  </text>
                  <text
                    x={label.x}
                    y={(y0 + y1) / 2 + 8}
                    textAnchor={label.anchor}
                    dominantBaseline="central"
                    className="fill-muted-foreground text-xs"
                    fontSize={11}
                  >
                    {truncateLabel(node.name)}
                  </text>
                </>
              ) : (
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
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function SankeyDiagram({ data, sourceCompany }: SankeyDiagramProps) {
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
        <SankeySVG data={data} width={width} height={FIXED_HEIGHT} sourceCompany={sourceCompany} />
      )}
    </div>
  );
}
