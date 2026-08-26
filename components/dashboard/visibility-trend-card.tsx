"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download, Scan } from "lucide-react";
import { VisibilityHoverTooltip } from "./visibility-hover-tooltip";
import type { MultiBrandTrendPoint } from "@/lib/db/dashboard";

interface VisibilityTrendCardProps {
  trend: MultiBrandTrendPoint[];
  onRunScan?: () => void;
}

/** Smooth cubic bezier curve generator from points */
function createBezierPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) * 0.4;
    const cp1y = p0.y;
    const cp2x = p1.x - (p1.x - p0.x) * 0.4;
    const cp2y = p1.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  return d;
}

export function VisibilityTrendCard({ trend, onRunScan }: VisibilityTrendCardProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const hasHistory = trend.length >= 2;

  // Chart Dimensions
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Extract all unique brands present across the trend
  const allBrandsMap = new Map<string, { brandName: string; isPrimary: boolean; color: string }>();
  trend.forEach((pt) => {
    pt.brands.forEach((b) => {
      if (!allBrandsMap.has(b.brandName)) {
        allBrandsMap.set(b.brandName, {
          brandName: b.brandName,
          isPrimary: b.isPrimary,
          color: b.color,
        });
      }
    });
  });

  const distinctBrands = Array.from(allBrandsMap.values());

  // Compute (x, y) coordinates for each brand across each time point
  const brandSeries = distinctBrands.map((b) => {
    const points = trend.map((pt, index) => {
      const x = paddingX + (index / Math.max(1, trend.length - 1)) * graphWidth;
      const brandData = pt.brands.find((item) => item.brandName === b.brandName);
      const percent = brandData ? brandData.visibilityPercent : 0;
      // y axis top to bottom (0% at bottom, 100% at top)
      const y = height - paddingY - (percent / 100) * graphHeight;
      return { x, y, percent, date: pt.formattedDate, fullDate: pt.date };
    });

    const svgPath = createBezierPath(points);
    return { ...b, points, svgPath };
  });

  // Handle CSV Export
  const handleExportCsv = () => {
    if (!hasHistory) return;

    const brandNames = distinctBrands.map((b) => b.brandName);
    const headers = ["Date", ...brandNames].join(",");

    const rows = trend.map((pt) => {
      const rowVals = brandNames.map((name) => {
        const b = pt.brands.find((item) => item.brandName === name);
        return b ? `${b.visibilityPercent}%` : "0%";
      });
      return [pt.date, ...rowVals].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `visibility-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mouse movement on chart for hover tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!hasHistory || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    // Calculate nearest data point index
    const svgRelativeX = (relativeX / rect.width) * width;
    const clampedX = Math.max(paddingX, Math.min(width - paddingX, svgRelativeX));
    const ratio = (clampedX - paddingX) / graphWidth;
    const nearestIdx = Math.round(ratio * (trend.length - 1));

    setHoverIndex(nearestIdx);
    setMousePos({ x: relativeX, y: relativeY });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm relative">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Visibility
            </span>
            <p className="text-xs font-normal text-muted-foreground">
              Percentage of chats mentioning each brand
            </p>
          </div>

          {hasHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        {!hasHistory ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-8 text-center bg-secondary/20 space-y-3 my-2">
            <TrendingUp className="h-8 w-8 text-muted-foreground/60" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Run another scan to track history</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Visibility trends compare your brand search mentions over time against key competitors.
              </p>
            </div>
            {onRunScan && (
              <Button size="sm" onClick={onRunScan} className="gap-2">
                <Scan className="h-3.5 w-3.5" />
                Run Scan
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* SVG Chart Container */}
            <div ref={containerRef} className="w-full relative overflow-hidden">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-52 text-foreground cursor-crosshair select-none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                role="img"
                aria-label="Multi-brand visibility trend chart"
              >
                {/* Horizontal Grid lines & Y Axis Labels */}
                {[100, 50, 25, 0].map((val) => {
                  const y = height - paddingY - (val / 100) * graphHeight;
                  return (
                    <g key={val}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={width - paddingX}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={0.1}
                        strokeDasharray="4"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[10px] fill-muted-foreground"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Date Labels */}
                {trend.map((pt, index) => {
                  const x = paddingX + (index / Math.max(1, trend.length - 1)) * graphWidth;
                  return (
                    <text
                      key={pt.scanId}
                      x={x}
                      y={height - paddingY + 16}
                      textAnchor="middle"
                      className="text-[10px] fill-muted-foreground"
                    >
                      {pt.formattedDate}
                    </text>
                  );
                })}

                {/* Brand Line Paths */}
                {brandSeries.map((series) => (
                  <path
                    key={series.brandName}
                    d={series.svgPath}
                    fill="none"
                    stroke={series.color}
                    strokeWidth={series.isPrimary ? 3 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300 opacity-90 hover:opacity-100"
                  />
                ))}

                {/* Hover Vertical Guide Line & Data Dots */}
                {hoverIndex !== null && hoverIndex < trend.length && (
                  <g>
                    {/* Vertical line */}
                    <line
                      x1={paddingX + (hoverIndex / Math.max(1, trend.length - 1)) * graphWidth}
                      y1={paddingY}
                      x2={paddingX + (hoverIndex / Math.max(1, trend.length - 1)) * graphWidth}
                      y2={height - paddingY}
                      stroke="currentColor"
                      strokeOpacity={0.3}
                      strokeDasharray="3"
                    />

                    {/* Dots on hover line */}
                    {brandSeries.map((series) => {
                      const pt = series.points[hoverIndex];
                      if (!pt) return null;
                      return (
                        <circle
                          key={series.brandName}
                          cx={pt.x}
                          cy={pt.y}
                          r={5}
                          fill={series.color}
                          stroke="var(--bg-base)"
                          strokeWidth={2}
                        />
                      );
                    })}
                  </g>
                )}
              </svg>

              {/* Floating Tooltip Component */}
              {hoverIndex !== null && hoverIndex < trend.length && (
                <VisibilityHoverTooltip
                  dateHeader={trend[hoverIndex].date}
                  brands={trend[hoverIndex].brands}
                  position={mousePos}
                />
              )}
            </div>

            {/* Bottom Brand Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
              {distinctBrands.map((b) => (
                <div key={b.brandName} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <span
                    className={
                      b.isPrimary
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {b.brandName}
                  </span>
                </div>
              ))}
            </div>

            {/* Screen Reader Table Alternative */}
            <div className="sr-only">
              <table>
                <caption>Multi-Brand Visibility Trend</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    {distinctBrands.map((b) => (
                      <th key={b.brandName} scope="col">
                        {b.brandName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trend.map((pt) => (
                    <tr key={pt.scanId}>
                      <td>{pt.date}</td>
                      {distinctBrands.map((b) => {
                        const item = pt.brands.find((i) => i.brandName === b.brandName);
                        return <td key={b.brandName}>{item ? `${item.visibilityPercent}%` : "0%"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
