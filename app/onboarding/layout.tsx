import * as React from "react";
import { Sparkles } from "lucide-react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      {/* Brand mark */}
      <div className="mb-10 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-bold text-xl tracking-wider text-foreground">
          AnswerOS
        </span>
      </div>

      {/* Page content */}
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
