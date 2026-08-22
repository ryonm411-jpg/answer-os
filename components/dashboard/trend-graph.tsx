"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Scan } from "lucide-react";
import type { DashboardTrendPoint } from "@/lib/db/dashboard";

interface TrendGraphProps {
  trend: DashboardTrendPoint[];
  onRunScan: () => void;
}

export function TrendGraph({ trend, onRunScan }: TrendGraphProps) {
  const hasHistory = trend.length >= 2;

  // Calculate coordinates for SVG rendering
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const validPoints = trend
    .map((item, index) => {
      if (item.score === null) return null;
      const x = paddingX + (index / Math.max(1, trend.length - 1)) * graphWidth;
      // score is 0..100; y goes top to bottom in SVG
      const y = height - paddingY - (item.score / 100) * graphHeight;
      return { ...item, x, y, index };
    })
    .filter(Boolean) as Array<DashboardTrendPoint & { x: number; y: number; index: number }>;

  const svgPath =
    validPoints.length > 1
      ? validPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";

  const areaPath =
    validPoints.length > 1
      ? `${svgPath} L ${validPoints[validPoints.length - 1].x} ${height - paddingY} L ${validPoints[0].x} ${height - paddingY} Z`
      : "";

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Visibility Score History
          </span>
          {hasHistory && (
            <span className="text-xs font-normal text-muted-foreground">
              {trend.length} Historical Scans
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        {!hasHistory ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-8 text-center bg-secondary/20 space-y-3 my-2">
            <TrendingUp className="h-8 w-8 text-muted-foreground/60" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Run another scan to see history</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Historical score trends compare your visibility over time across multiple completed scans.
              </p>
            </div>
            <Button size="sm" onClick={onRunScan} className="gap-2">
              <Scan className="h-3.5 w-3.5" />
              Run Scan
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* SVG Trend Line */}
            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-44 text-primary"
                role="img"
                aria-label="Visibility score trend chart over completed scans"
              >
                {/* Grid lines */}
                <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="currentColor" strokeOpacity={0.1} strokeDasharray="4" />
                <line x1={paddingX} y1={paddingY + graphHeight / 2} x2={width - paddingX} y2={paddingY + graphHeight / 2} stroke="currentColor" strokeOpacity={0.1} strokeDasharray="4" />
                <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="currentColor" strokeOpacity={0.1} strokeDasharray="4" />

                {/* Y Axis Labels */}
                <text x={paddingX - 8} y={paddingY + 4} textAnchor="end" className="text-[10px] fill-muted-foreground">100</text>
                <text x={paddingX - 8} y={paddingY + graphHeight / 2 + 4} textAnchor="end" className="text-[10px] fill-muted-foreground">50</text>
                <text x={paddingX - 8} y={height - paddingY + 4} textAnchor="end" className="text-[10px] fill-muted-foreground">0</text>

                {/* Area Fill */}
                {areaPath && <path d={areaPath} fill="currentColor" fillOpacity={0.12} />}

                {/* Main Line */}
                {svgPath && <path d={svgPath} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}

                {/* Data Points */}
                {validPoints.map((p) => (
                  <g key={p.scanId} className="group cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={5}
                      className="fill-background stroke-primary stroke-2 group-hover:r-7 transition-all"
                    />
                    <title>
                      {`Score: ${p.score} (${new Date(p.completedAt).toLocaleDateString()})`}
                    </title>
                  </g>
                ))}
              </svg>
            </div>

            {/* Screen Reader Table Alternative */}
            <div className="sr-only">
              <table>
                <caption>Visibility Score History</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((pt) => (
                    <tr key={pt.scanId}>
                      <td>{new Date(pt.completedAt).toLocaleDateString()}</td>
                      <td>{pt.score ?? "No Score"}</td>
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
