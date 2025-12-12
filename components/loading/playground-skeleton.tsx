"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PlaygroundSkeleton() {
  return (
    <div 
      className="flex h-screen w-full"
      role="status"
      aria-label="Loading playground"
    >
      {/* File Explorer Sidebar */}
      <div className="w-64 border-r bg-muted/30 p-4 space-y-3">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" style={{ width: `${60 + Math.random() * 40}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b px-4 flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-1" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        {/* File Tabs */}
        <div className="border-b bg-muted/30 px-4 py-2">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-md" />
            ))}
          </div>
        </div>

        {/* Editor and Preview Panels */}
        <div className="flex-1 flex">
          {/* Editor Panel */}
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2">
              {[...Array(12)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="h-5" 
                  style={{ width: `${50 + Math.random() * 50}%` }} 
                />
              ))}
            </div>
            <div className="flex items-center justify-center pt-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="ml-3 text-sm text-muted-foreground">
                Loading editor...
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-1 bg-border" />

          {/* Preview Panel */}
          <div className="flex-1 p-4 bg-muted/20">
            <div className="h-full rounded-lg border bg-background flex items-center justify-center">
              <div className="text-center space-y-2">
                <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading playground environment...</span>
    </div>
  );
}
