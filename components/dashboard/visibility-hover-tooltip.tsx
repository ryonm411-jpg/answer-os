"use client";

import type { BrandVisibilityPoint } from "@/lib/db/dashboard";

interface VisibilityHoverTooltipProps {
  dateHeader: string;
  brands: BrandVisibilityPoint[];
  position: { x: number; y: number };
}

export function VisibilityHoverTooltip({
  dateHeader,
  brands,
  position,
}: VisibilityHoverTooltipProps) {
  // Sort brands descending by visibility percent for clear hierarchy
  const sortedBrands = [...brands].sort(
    (a, b) => b.visibilityPercent - a.visibilityPercent
  );

  return (
    <div
      className="absolute z-30 pointer-events-none rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-2 min-w-[160px] transition-all duration-75"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%) translateY(-12px)",
      }}
    >
      {/* Date Header */}
      <div className="font-semibold text-foreground border-b border-border/60 pb-1.5 text-[11px] font-mono">
        {dateHeader}
      </div>

      {/* Brand Breakdown List */}
      <div className="space-y-1.5">
        {sortedBrands.map((b) => (
          <div
            key={b.brandName}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-1.5 truncate max-w-[110px]">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: b.color }}
              />
              <span
                className={`truncate ${
                  b.isPrimary
                    ? "font-bold text-foreground"
                    : "font-normal text-muted-foreground"
                }`}
              >
                {b.brandName}
              </span>
            </div>
            <span className="font-mono text-foreground font-semibold">
              {b.visibilityPercent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
