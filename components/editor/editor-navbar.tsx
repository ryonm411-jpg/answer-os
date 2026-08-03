"use client";

import * as React from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface EditorNavbarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  domainName?: string;
  scanStatus?: string;
}

export function EditorNavbar({
  isOpen,
  onToggleSidebar,
  domainName = "shopify.com",
  scanStatus = "Active",
}: EditorNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
                className="h-9 w-9"
              />
            }
          >
            {isOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isOpen ? "Close navigation" : "Open navigation"}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight text-foreground">
            {domainName}
          </span>
          <Badge
            variant="outline"
            className="hidden sm:inline-flex text-[11px] font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-400 py-0.5 px-2"
          >
            {scanStatus}
          </Badge>
        </div>
      </div>

      {/* Center Section (Reserved) */}
      <div className="hidden md:flex flex-1 items-center justify-center max-w-md px-4">
        {/* Reserved for future Search / Command Palette */}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  );
}
