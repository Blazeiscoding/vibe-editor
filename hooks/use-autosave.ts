import { useEffect, useRef, useState, useCallback } from "react"

interface UseAutosaveOptions<T> {
  onSave: (data: T) => Promise<void> | void
  delay?: number
  enabled?: boolean
}

interface AutosaveStatus {
  isSaving: boolean
  lastSaved: Date | null
  error: Error | null
}

export function useAutosave<T>({ onSave, delay = 2000, enabled = true }: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
  })
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dataRef = useRef<T | null>(null)
  const isSavingRef = useRef(false)

  const save = useCallback(async () => {
    if (isSavingRef.current || !dataRef.current) return

    try {
      isSavingRef.current = true
      setStatus(prev => ({ ...prev, isSaving: true, error: null }))
      
      await onSave(dataRef.current)
      
      setStatus({
        isSaving: false,
        lastSaved: new Date(),
        error: null,
      })
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isSaving: false,
        error: error as Error,
      }))
      console.error("Autosave failed:", error)
    } finally {
      isSavingRef.current = false
    }
  }, [onSave])

  const trigger = useCallback((data: T) => {
    if (!enabled) return

    dataRef.current = data

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save()
    }, delay)
  }, [enabled, delay, save])

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    await save()
  }, [save])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    trigger,
    saveNow,
    status,
  }
}
