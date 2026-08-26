"use client";

import * as React from "react";
import { Cpu, Lock, RotateCcw } from "lucide-react";
import {
  getProviderCatalog,
  resetProviderPreferences,
  updateProviderPreferences,
} from "@/lib/api/providers";
import type { ProviderCatalogView } from "@/lib/api/providers";
import type { AIProviderName } from "@/lib/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * All Models tab — per-provider enablement for scans & prompt generation
 * (spec 18, §11). Mounted in the EditorNavbar center section on md+ screens.
 */
export function ModelsTab() {
  const [view, setView] = React.useState<ProviderCatalogView | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getProviderCatalog()
      .then((data) => {
        if (!cancelled) setView(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load AI models."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = view?.providers.length ?? 0;
  const enabledCount = view?.providers.filter((p) => p.enabled).length ?? 0;
  const allEntitledOn =
    view !== null &&
    view.providers.filter((p) => !p.locked).every((p) => p.enabled);
  const hasLocked = view?.providers.some((p) => p.locked) ?? false;

  const handleToggle = async (name: AIProviderName) => {
    if (!view) return;
    const current = view.providers.find((p) => p.name === name);
    if (!current || current.locked) return;
    // Last-enabled guard: never allow disabling the final enabled provider.
    if (current.enabled && enabledCount <= 1) return;

    const previous = view;
    const previouslyEnabled = previous.providers
      .filter((p) => p.enabled)
      .map((p) => p.name);
    const nextEnabled = current.enabled
      ? previouslyEnabled.filter((n) => n !== name)
      : [...previouslyEnabled, name];

    // Optimistic update, revert on failure (spec 18, §11).
    setView({
      ...previous,
      providers: previous.providers.map((p) =>
        p.name === name ? { ...p, enabled: !p.enabled } : p
      ),
    });
    setError(null);

    try {
      await updateProviderPreferences(nextEnabled);
    } catch (err) {
      setView(previous);
      setError(
        err instanceof Error ? err.message : "Failed to update AI model selection."
      );
    }
  };

  const handleReset = async () => {
    if (!view) return;
    setError(null);
    try {
      await resetProviderPreferences();
      const fresh = await getProviderCatalog();
      setView(fresh);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset AI model selection."
      );
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 px-3"
            aria-label="All Models"
          />
        }
      >
        <Cpu className="h-4 w-4" />
        <span>All Models</span>
        {view && (
          <Badge
            variant="outline"
            className={cn(
              "ml-0.5 px-1.5 py-0 text-[10px] font-semibold",
              allEntitledOn
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-border/60 bg-accent/30 text-muted-foreground"
            )}
          >
            {enabledCount}/{total}
          </Badge>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="center"
        sideOffset={8}
        className="w-[22rem] max-w-[calc(100vw-2rem)]"
      >
        <PopoverHeader>
          <PopoverTitle>AI Models</PopoverTitle>
          <PopoverDescription>
            {view
              ? `${enabledCount} of ${total} enabled — used for scans & prompt generation`
              : "Loading models…"}
          </PopoverDescription>
        </PopoverHeader>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {!view &&
            !error &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg border border-border/50 bg-accent/20"
              />
            ))}

          {view?.providers.map((provider) => {
            const isLastEnabled = provider.enabled && enabledCount === 1;
            const switchDisabled = provider.locked || isLastEnabled;

            const switchNode = (
              <Switch
                checked={provider.enabled}
                disabled={switchDisabled}
                onCheckedChange={() => handleToggle(provider.name)}
                aria-label={`Enable ${provider.label}`}
              />
            );

            return (
              <div
                key={provider.name}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3",
                  provider.locked
                    ? "border-border/40 bg-accent/20 text-muted-foreground"
                    : "border-border/80 bg-card text-foreground"
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {isLastEnabled ? (
                    <Tooltip>
                      <TooltipTrigger render={switchNode} />
                      <TooltipContent side="left">
                        At least one model must stay enabled
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    switchNode
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold tracking-tight">
                        {provider.label}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "px-1.5 py-0 text-[10px] font-medium",
                          provider.tier === "free"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-primary/20 bg-primary/10 text-primary"
                        )}
                      >
                        {provider.tier === "free" ? "Free Tier" : "Paid"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {provider.locked ? (
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium">
                      <Lock className="h-4 w-4 shrink-0" />
                      Unlocks with paid plan
                    </span>
                  ) : !provider.configured ? (
                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                      Not configured
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "whitespace-nowrap text-[11px] font-medium",
                        provider.enabled
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {provider.enabled ? "On" : "Off"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!view}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </Button>
          {hasLocked && (
            <a
              href="/billing"
              className="text-xs font-medium text-primary hover:underline"
            >
              Manage plan
            </a>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
