"use client";

import * as React from "react";
import { Sparkles, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PromptGenerationActionsProps {
  productDescription: string;
  industry: string;
  onSaveProfile: (profile: { productDescription: string; industry: string }) => Promise<void>;
  onGenerateSuggestions: (count: number) => Promise<void>;
  isGenerating: boolean;
  isLocked?: boolean;
}

export function PromptGenerationActions({
  productDescription: initialProductDesc,
  industry: initialIndustry,
  onSaveProfile,
  onGenerateSuggestions,
  isGenerating,
  isLocked = false,
}: PromptGenerationActionsProps) {
  const [productDescription, setProductDescription] = React.useState(initialProductDesc);
  const [industry, setIndustry] = React.useState(initialIndustry);
  const [promptCount, setPromptCount] = React.useState<number>(6);
  const [isEditingProfile, setIsEditingProfile] = React.useState(!initialProductDesc);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [prevDesc, setPrevDesc] = React.useState(initialProductDesc);
  const [prevInd, setPrevInd] = React.useState(initialIndustry);

  if (initialProductDesc !== prevDesc || initialIndustry !== prevInd) {
    setPrevDesc(initialProductDesc);
    setPrevInd(initialIndustry);
    setProductDescription(initialProductDesc);
    setIndustry(initialIndustry);
    if (!initialProductDesc) {
      setIsEditingProfile(true);
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!productDescription.trim()) {
      setError("Please describe what your business sells so AnswerOS can find relevant customer searches.");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveProfile({ productDescription: productDescription.trim(), industry: industry.trim() });
      setIsEditingProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save business details");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateClick = async () => {
    if (!initialProductDesc && !productDescription.trim()) {
      setIsEditingProfile(true);
      setError("Please provide a brief description of your business first.");
      return;
    }
    await onGenerateSuggestions(promptCount);
  };

  return (
    <div className="space-y-4">
      {/* About Your Business Accordion Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                About Your Business
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
            >
              {isEditingProfile ? (
                <>
                  Collapse <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  {initialProductDesc ? "Edit details" : "Add details"} <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          </div>

          {!isEditingProfile && initialProductDesc ? (
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-md border border-border/50">
              {initialIndustry && (
                <p>
                  <strong className="text-foreground">Category:</strong> {initialIndustry}
                </p>
              )}
              <p className="line-clamp-2">
                <strong className="text-foreground">Offering & Target Audience:</strong> {initialProductDesc}
              </p>
            </div>
          ) : null}

          {isEditingProfile && (
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
              {error && (
                <p className="text-xs text-destructive font-medium" role="alert">
                  {error}
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="category-input" className="text-xs">
                  Business category / Industry
                </Label>
                <Input
                  id="category-input"
                  placeholder="e.g. Footwear, PC Hardware, Accounting Firm, Project Software"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-desc-input" className="text-xs">
                  What you sell and who it&apos;s for *
                </Label>
                <Textarea
                  id="product-desc-input"
                  placeholder="Describe your products, services, and target customers. This helps AnswerOS discover the exact questions your customers ask AI."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={isSaving} className="h-8 text-xs">
                  {isSaving ? "Saving..." : "Save Details"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Action bar with Generate button & Count Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          AnswerOS automatically discovers high-intent questions across discovery, comparison, and buying decisions.
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={String(promptCount)}
            onValueChange={(val) => setPromptCount(Number(val))}
            disabled={isGenerating || isLocked}
          >
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="6 Questions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Questions</SelectItem>
              <SelectItem value="6">6 Questions</SelectItem>
              <SelectItem value="9">9 Questions</SelectItem>
              <SelectItem value="12">12 Questions</SelectItem>
              <SelectItem value="15">15 Questions</SelectItem>
              <SelectItem value="20">20 Questions</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleGenerateClick}
            disabled={isGenerating || isLocked}
            className="gap-2 shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isGenerating ? "Finding questions..." : "Find AI Search Questions"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
