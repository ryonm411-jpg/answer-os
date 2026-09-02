"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  LayoutDashboard,
  HelpCircle,
  History,
  CreditCard,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDialogs } from "@/hooks/use-dialogs";

export interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/editor" },
  { name: "Prompts", icon: HelpCircle, href: "/prompts" },
  { name: "Scan History", icon: History, href: "/scans" },
  { name: "Billing", icon: CreditCard, href: "/billing" },
];

export function NavigationSidebar({ isOpen, onClose }: NavigationSidebarProps) {
  const { openDialog } = useDialogs();
  const pathname = usePathname();

  // Listen for Escape key on mobile overlay
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleAddDomain = () => {
    openDialog("add-domain");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Container: Pinned on Desktop (md+), Overlay Drawer on Mobile (<md) */}
      <aside
        role="dialog"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card/95 shadow-xl backdrop-blur transition-all duration-200 ease-in-out md:static md:z-20 md:h-[calc(100vh-3.5rem)] md:shrink-0 md:bg-card/60 md:shadow-none"
        )}
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border/80 px-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-wide text-foreground">
              AnswerOS
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/editor" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto text-[10px] uppercase font-semibold tracking-wider opacity-90">
                    Active
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-border/80 p-3">
          <Button
            className="w-full justify-center gap-2 text-xs font-semibold"
            size="sm"
            onClick={handleAddDomain}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Domain</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
