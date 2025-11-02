import { Skeleton } from "@/components/ui/skeleton"

export function TerminalSkeleton() {
  return (
    <div className="h-full w-full bg-gray-950 dark:bg-black p-4 space-y-2">
      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <Skeleton className="h-6 w-32 bg-gray-800" />
      </div>
      
      {/* Terminal lines */}
      <div className="space-y-2 font-mono text-sm">
        <Skeleton className="h-4 w-64 bg-gray-800" />
        <Skeleton className="h-4 w-48 bg-gray-800" />
        <Skeleton className="h-4 w-56 bg-gray-800" />
        <Skeleton className="h-4 w-40 bg-gray-800" />
        <Skeleton className="h-4 w-52 bg-gray-800" />
      </div>
      
      {/* Loading indicator */}
      <div className="flex items-center gap-2 pt-4">
        <div className="w-6 h-6 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-400">
          Loading Terminal...
        </p>
      </div>
    </div>
  )
}
