"use client";

import * as React from "react";
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PromptCardGrid } from "./prompt-card-grid";
import { PromptForm } from "./prompt-form";
import { PromptGenerationActions } from "./prompt-generation-actions";
import type { PromptCardData } from "./prompt-card";
import type { PromptIntent } from "@/lib/prompts/intent";
import { PROMPT_INTENTS, INTENT_LABELS } from "@/lib/prompts/intent";

export interface PromptWorkspaceProps {
  initialPrompts: PromptCardData[];
  companyName: string;
  initialProductDescription: string;
  initialIndustry: string;
  isScanActive?: boolean;
}

export function PromptWorkspace({
  initialPrompts,
  companyName,
  initialProductDescription,
  initialIndustry,
  isScanActive = false,
}: PromptWorkspaceProps) {
  const [prompts, setPrompts] = React.useState<PromptCardData[]>(initialPrompts);
  const [productDescription, setProductDescription] = React.useState(initialProductDescription);
  const [industry, setIndustry] = React.useState(initialIndustry);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIntent, setSelectedIntent] = React.useState<string>("ALL");
  const [selectedSource, setSelectedSource] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<"OPPORTUNITY" | "RELEVANCE" | "TEXT">("OPPORTUNITY");

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingPrompt, setEditingPrompt] = React.useState<PromptCardData | null>(null);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState("");
  const [infoMessage, setInfoMessage] = React.useState("");

  const refreshPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      const json = await res.json();
      if (res.ok && json.data?.prompts) {
        setPrompts(json.data.prompts);
      }
    } catch {
      // Keep existing local state on network error
    }
  };

  const handleSaveProfile = async (profile: { productDescription: string; industry: string }) => {
    const res = await fetch("/api/company/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || "Failed to update profile");
    }
    setProductDescription(profile.productDescription);
    setIndustry(profile.industry);
  };

  const handleGenerateSuggestions = async () => {
    setError("");
    setInfoMessage("");
    setIsGenerating(true);
    try {
      const res = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productDescription, category: industry }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to generate suggestions");
      }
      if (json.data?.count === 0) {
        setInfoMessage("All generated AI suggestions already exist in your active prompt workspace.");
      }
      await refreshPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate suggestions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateOrUpdatePrompt = async (data: {
    text: string;
    category: string;
    intent: PromptIntent;
  }) => {
    setError("");
    if (editingPrompt) {
      const res = await fetch(`/api/prompts/${editingPrompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update prompt");
      }
    } else {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create custom prompt");
      }
    }
    await refreshPrompts();
  };

  const handleArchivePrompt = async (promptId: string) => {
    setError("");
    try {
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to archive prompt");
      }
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive prompt");
    }
  };

  // Filtering & Sorting
  const filteredPrompts = React.useMemo(() => {
    return prompts
      .filter((p) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesText = p.text.toLowerCase().includes(q);
          const matchesCat = p.category.toLowerCase().includes(q);
          if (!matchesText && !matchesCat) return false;
        }
        if (selectedIntent !== "ALL" && p.intent !== selectedIntent) {
          return false;
        }
        if (selectedSource !== "ALL" && p.source !== selectedSource) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "OPPORTUNITY") {
          const scoreA = a.opportunityScore ?? -1;
          const scoreB = b.opportunityScore ?? -1;
          if (scoreA !== scoreB) return scoreB - scoreA;
          const relA = a.businessRelevance ?? 0;
          const relB = b.businessRelevance ?? 0;
          if (relA !== relB) return relB - relA;
          return a.text.localeCompare(b.text);
        }
        if (sortBy === "RELEVANCE") {
          const relA = a.businessRelevance ?? 0;
          const relB = b.businessRelevance ?? 0;
          if (relA !== relB) return relB - relA;
          return a.text.localeCompare(b.text);
        }
        return a.text.localeCompare(b.text);
      });
  }, [prompts, searchQuery, selectedIntent, selectedSource, sortBy]);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Prompt Management & Opportunity Ranking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and prioritize buyer questions AnswerOS tests for{" "}
            <strong className="text-foreground">{companyName}</strong> before scanning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {prompts.length} Active Prompts
          </Badge>
          <Button
            onClick={() => {
              setEditingPrompt(null);
              setIsFormOpen(true);
            }}
            disabled={isScanActive}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Prompt</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      {infoMessage && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-md text-sm text-primary font-medium">
          {infoMessage}
        </div>
      )}

      {/* Business Profile Grounding Actions */}
      <PromptGenerationActions
        productDescription={productDescription}
        industry={industry}
        onSaveProfile={handleSaveProfile}
        onGenerateSuggestions={handleGenerateSuggestions}
        isGenerating={isGenerating}
        isLocked={isScanActive}
      />

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card border border-border p-3 rounded-lg">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Intent Filter */}
          <Select value={selectedIntent} onValueChange={setSelectedIntent}>
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="All Intents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Intents</SelectItem>
              {PROMPT_INTENTS.map((i) => (
                <SelectItem key={i} value={i}>
                  {INTENT_LABELS[i]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sources</SelectItem>
              <SelectItem value="CURATED">Curated</SelectItem>
              <SelectItem value="AI_SUGGESTED">AI Suggested</SelectItem>
              <SelectItem value="USER_CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "OPPORTUNITY" | "RELEVANCE" | "TEXT")}>
            <SelectTrigger className="h-9 w-[170px] text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPPORTUNITY">Opportunity Score</SelectItem>
              <SelectItem value="RELEVANCE">Business Relevance</SelectItem>
              <SelectItem value="TEXT">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Prompt Cards Grid */}
      <PromptCardGrid
        prompts={filteredPrompts}
        onEdit={(p) => {
          setEditingPrompt(p);
          setIsFormOpen(true);
        }}
        onArchive={handleArchivePrompt}
        isLocked={isScanActive}
      />

      {/* Add / Edit Form Modal */}
      <PromptForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPrompt(null);
        }}
        onSave={handleCreateOrUpdatePrompt}
        editingPrompt={editingPrompt}
      />
    </div>
  );
}
