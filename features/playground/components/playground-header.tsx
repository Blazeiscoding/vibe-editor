"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function PlaygroundHeader() {
  return (
    <header className="h-14 border-b flex items-center px-4 justify-between">
      <div className="flex items-center">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-lg font-semibold">Code Editor</h1>
      </div>
    </header>
  );
}
