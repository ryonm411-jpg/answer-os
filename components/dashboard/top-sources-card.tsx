"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SourceTypeBreakdown } from "@/lib/db/sources";
import { Globe } from "lucide-react";

interface TopSourcesCardProps {
  totalSourcesCount: number;
  breakdown: SourceTypeBreakdown[];
}

export function TopSourcesCard({
  totalSourcesCount,
  breakdown,
}: TopSourcesCardProps) {
  // SVG Donut Calculations
  const size = 160;
  const strokeWidth = 18;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute SVG stroke-dasharray segments
  let accumulatedAngle = 0;

  const totalSegmentCount = breakdown.reduce((acc, b) => acc + b.count, 0);

  const segments = breakdown.map((item) => {
    const fraction = totalSegmentCount > 0 ? item.count / totalSegmentCount : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += fraction;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span>Top Sources</span>
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            Sources across active models
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2 pb-6 space-y-6 flex-1 flex flex-col justify-center items-center">
        <span className="text-xs font-medium text-muted-foreground self-start mb-1">
          Sources Type
        </span>

        {/* SVG Donut Container */}
        <div className="relative flex items-center justify-center my-2">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="hsl(var(--muted)/0.3)"
              strokeWidth={strokeWidth}
            />

            {/* Segment arcs */}
            {totalSourcesCount > 0 &&
              segments.map((segment) => (
                <circle
                  key={segment.type}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-500 ease-out"
                />
              ))}
          </svg>

          {/* Donut Center Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
              {totalSourcesCount}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground mt-1">
              Sources
            </span>
          </div>
        </div>

        {/* Category Legend */}
        <div className="w-full pt-3 border-t border-border/60">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
            {breakdown.length > 0 ? (
              breakdown.map((item) => (
                <div key={item.type} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-foreground">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    ({item.percentage}%)
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">
                No citations recorded for current scan
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
