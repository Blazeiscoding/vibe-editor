"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function PlaygroundHeader() {
  return (
    <header className="h-14 border-b flex items-center px-4 justify-between glass sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <div className="h-5 w-[1px] bg-border mx-1" />
        <h1 className="text-sm font-medium opacity-80">vibe-editor</h1>
      </div>
      <div>
         {/* Future implementation: User profile or share button */}
      </div>
    </header>
  );
}
