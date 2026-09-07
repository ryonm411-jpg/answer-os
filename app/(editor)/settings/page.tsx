"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  Shield,
  Cookie,
  Trash2,
  ExternalLink,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updatePostHogConsent } from "@/lib/analytics/posthog-client";

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [cookieConsent, setCookieConsent] = React.useState<"accepted" | "rejected">("rejected");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("answeros_cookie_consent");
      const status = stored === "accepted" ? "accepted" : "rejected";
      const timer = setTimeout(() => setCookieConsent(status), 0);
      return () => clearTimeout(timer);
    } catch {
      // Ignore fallback
    }
  }, []);

  const handleToggleConsent = (newStatus: "accepted" | "rejected") => {
    try {
      localStorage.setItem("answeros_cookie_consent", newStatus);
    } catch {
      // Ignore fallback
    }
    setCookieConsent(newStatus);
    updatePostHogConsent(newStatus);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to process account deletion.");
      }

      // Clear local state and sign out
      try {
        localStorage.removeItem("answeros_cookie_consent");
      } catch {
        // Ignore storage errors
      }

      await signOut();
      router.push("/");
    } catch (err) {
      console.error(err);
      setDeleteError(
        err instanceof Error ? err.message : "An error occurred during account deletion."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Settings &amp; Privacy Controls
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences, cookie consent choices, and PIPEDA data deletion rights.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Cookie Consent Card */}
        <Card className="bg-card/80 border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cookie className="h-4 w-4 text-primary" />
              Cookie &amp; Product Analytics Preferences
            </CardTitle>
            <CardDescription className="text-xs">
              Essential authentication cookies are always active. Control whether optional product interaction analytics (PostHog) are collected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/30 text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">
                  Product Performance &amp; Usage Analytics
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Status:{" "}
                  <strong className={cookieConsent === "accepted" ? "text-emerald-400" : "text-amber-400"}>
                    {cookieConsent === "accepted" ? "Active (Opted In)" : "Disabled (Opted Out)"}
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={cookieConsent === "rejected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleConsent("rejected")}
                  className="h-8 text-xs font-medium"
                >
                  Opt Out
                </Button>
                <Button
                  variant={cookieConsent === "accepted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleConsent("accepted")}
                  className="h-8 text-xs font-medium"
                >
                  Opt In
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Documentation Links */}
        <Card className="bg-card/80 border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Legal &amp; Data Transparency Documentation
            </CardTitle>
            <CardDescription className="text-xs">
              Review AnswerOS privacy commitments, SaaS terms, cookie policy, and vendor disclosures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Link
                href="/privacy"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20 hover:bg-accent/50 transition-colors font-medium text-foreground"
              >
                <span>Privacy Policy</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                href="/terms"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20 hover:bg-accent/50 transition-colors font-medium text-foreground"
              >
                <span>Terms of Service</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                href="/cookies"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20 hover:bg-accent/50 transition-colors font-medium text-foreground"
              >
                <span>Cookie Policy</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                href="/subprocessors"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/20 hover:bg-accent/50 transition-colors font-medium text-foreground"
              >
                <span>Subprocessors List</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Self-Serve Account Deletion */}
        <Card className="bg-destructive/5 border-destructive/30 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete Account &amp; Personal Data (PIPEDA Right to Erasure)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Permanently remove your account, organization details, scan histories, prompts, and recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once initiated, all your stored user profiles, tracked domains, AI visibility scans, and recommendations will be permanently purged. This action is irreversible.
            </p>

            {deleteError && (
              <div className="p-3 rounded border border-destructive/40 bg-destructive/10 text-destructive text-xs">
                {deleteError}
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger>
                <Button variant="destructive" size="sm" className="font-semibold text-xs gap-2">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete My Account &amp; Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border text-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-muted-foreground space-y-2 pt-2">
                    <p>
                      This action will permanently delete your AnswerOS user account, tracked company profile, scan history, custom prompts, and AI recommendations.
                    </p>
                    <p className="font-semibold text-foreground">
                      This action cannot be undone.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-3">
                  <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
                  >
                    {isDeleting ? "Deleting Data..." : "Confirm & Delete Everything"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
