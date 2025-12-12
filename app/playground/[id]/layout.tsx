import { SidebarProvider } from "@/components/ui/sidebar";
import { PlaygroundErrorBoundary } from "@/components/feature-error-boundary";
import React from "react";

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <PlaygroundErrorBoundary>
        {children}
      </PlaygroundErrorBoundary>
    </SidebarProvider>
  );
}
