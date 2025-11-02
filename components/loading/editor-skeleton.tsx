import { Skeleton } from "@/components/ui/skeleton"

export function EditorSkeleton() {
  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 p-4 space-y-3">
      {/* Editor toolbar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
      
      {/* Code lines */}
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-[90%]" />
        <Skeleton className="h-5 w-[95%]" />
        <Skeleton className="h-5 w-[85%]" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-[92%]" />
        <Skeleton className="h-5 w-[88%]" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-[93%]" />
        <Skeleton className="h-5 w-[87%]" />
      </div>
      
      {/* Loading text */}
      <div className="flex items-center justify-center pt-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">
          Loading Monaco Editor...
        </p>
      </div>
    </div>
  )
}
