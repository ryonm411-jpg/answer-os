"use client";

import * as React from "react";
import {
  X,
  LayoutDashboard,
  Globe,
  History,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  icon: React.ElementType;
  href: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "#", active: true },
  { name: "Domains", icon: Globe, href: "#" },
  { name: "Scan History", icon: History, href: "#" },
  { name: "Reports", icon: BarChart3, href: "#" },
  { name: "Settings", icon: Settings, href: "#" },
];

export function NavigationSidebar({ isOpen, onClose }: NavigationSidebarProps) {
  // Listen for Escape key to close the sidebar
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-full sm:w-72 flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wider text-foreground">
              AnswerOS
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (!item.active) {
                    e.preventDefault();
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
                {item.active && (
                  <span className="ml-auto text-[10px] uppercase font-semibold tracking-wider opacity-80">
                    Active
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-border p-4">
          <Button className="w-full justify-center gap-2" size="default">
            <Plus className="h-4 w-4" />
            <span>Add Domain</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
