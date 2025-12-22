"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import to ensure proper client-side hydration with QueryProvider
const SettingsClient = dynamic(
  () =>
    import("@/features/settings/components/settings-client").then(
      (mod) => mod.SettingsClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="container max-w-4xl mx-auto py-10 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    ),
  }
);

export default function SettingsPage() {
  return <SettingsClient />;
}
