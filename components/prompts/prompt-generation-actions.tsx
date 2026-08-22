"use client";

import * as React from "react";
import { Sparkles, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export interface PromptGenerationActionsProps {
  productDescription: string;
  industry: string;
  onSaveProfile: (profile: { productDescription: string; industry: string }) => Promise<void>;
  onGenerateSuggestions: () => Promise<void>;
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
  const [isEditingProfile, setIsEditingProfile] = React.useState(!initialProductDesc);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setProductDescription(initialProductDesc);
    setIndustry(initialIndustry);
    if (!initialProductDesc) {
      setIsEditingProfile(true);
    }
  }, [initialProductDesc, initialIndustry]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!productDescription.trim()) {
      setError("Product description is required to ground prompt generation");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveProfile({ productDescription: productDescription.trim(), industry: industry.trim() });
      setIsEditingProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Business Profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateClick = async () => {
    if (!initialProductDesc && !productDescription.trim()) {
      setIsEditingProfile(true);
      setError("Please save a Business Profile first so AI can generate relevant prompts.");
      return;
    }
    await onGenerateSuggestions();
  };

  return (
    <div className="space-y-4">
      {/* Business Profile Accordion Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Business Profile (Grounded AI Context)
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
                  {initialProductDesc ? "Edit Profile" : "Set Profile"} <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          </div>

          {!isEditingProfile && initialProductDesc ? (
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-md border border-border/50">
              <p>
                <strong className="text-foreground">Category:</strong> {initialIndustry || "General"}
              </p>
              <p className="line-clamp-2">
                <strong className="text-foreground">Product Description:</strong> {initialProductDesc}
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
                  Primary Category / Industry
                </Label>
                <Input
                  id="category-input"
                  placeholder="e.g. Barefoot Footwear or B2B SaaS CRM"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-desc-input" className="text-xs">
                  Product / Solution Description *
                </Label>
                <Textarea
                  id="product-desc-input"
                  placeholder="Describe what your company sells, who it serves, and key use cases. e.g. Minimalist barefoot footwear for running, walking, and natural foot health."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={isSaving} className="h-8 text-xs">
                  {isSaving ? "Saving..." : "Save Business Profile"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Action bar with Generate button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          AI generation uses your Business Profile to discover high-value buyer prompts across all 7 intents.
        </p>

        <Button
          onClick={handleGenerateClick}
          disabled={isGenerating || isLocked}
          className="gap-2 shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          <span>{isGenerating ? "Generating..." : "Generate AI Suggestions"}</span>
        </Button>
      </div>
    </div>
  );
}
