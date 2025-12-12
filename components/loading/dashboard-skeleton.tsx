"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div 
      className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10"
      role="status"
      aria-label="Loading dashboard"
    >
      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>

      {/* Recent Projects Section */}
      <div className="mt-8 w-full">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mt-8 w-full">
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Project Table */}
      <div className="mt-6 w-full">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-md" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading dashboard content...</span>
    </div>
  );
}
