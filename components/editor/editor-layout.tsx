"use client";

import * as React from "react";
import { EditorNavbar } from "./editor-navbar";
import { NavigationSidebar } from "./navigation-sidebar";
import { DialogProvider } from "@/hooks/use-dialogs";
import { DialogContainer } from "@/components/dialogs/dialog-container";

export interface EditorLayoutProps {
  children: React.ReactNode;
  domainName?: string;
}

export function EditorLayout({ children, domainName }: EditorLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = React.useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <DialogProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Navigation Sidebar */}
        <NavigationSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Top Navbar */}
        <EditorNavbar
          isOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          domainName={domainName}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Dialog System */}
        <DialogContainer />
      </div>
    </DialogProvider>
  );
}
