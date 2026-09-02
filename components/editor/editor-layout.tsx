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
  // Constantly showing by default on desktop unless closed
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = React.useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <DialogProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Top Navbar */}
        <EditorNavbar
          isOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          domainName={domainName}
        />

        {/* Content Shell: Fixed Sidebar + Main Content */}
        <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
          {/* Navigation Sidebar */}
          <NavigationSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 px-4 py-6 md:px-8 max-w-7xl w-full mx-auto transition-all duration-200">
            {children}
          </main>
        </div>

        {/* Dialog System */}
        <DialogContainer />
      </div>
    </DialogProvider>
  );
}
