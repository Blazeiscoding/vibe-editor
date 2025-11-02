import { CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface AutosaveIndicatorProps {
  isSaving: boolean
  lastSaved: Date | null
  error: Error | null
  className?: string
}

export function AutosaveIndicator({ isSaving, lastSaved, error, className }: AutosaveIndicatorProps) {
  if (error) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400", className)}>
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Failed to save</span>
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Saving...</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400", className)}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400", className)}>
      <Clock className="h-3.5 w-3.5" />
      <span>Not saved</span>
    </div>
  )
}
