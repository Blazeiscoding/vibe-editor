"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description?: string;
  /** Confirm button text */
  confirmLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Callback when confirmed */
  onConfirm: () => void | Promise<void>;
  /** Whether confirm action is loading */
  isLoading?: boolean;
  /** Variant affects styling */
  variant?: "default" | "destructive";
}

/**
 * Reusable confirmation dialog component
 *
 * @example
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Delete Project"
 *   description="This action cannot be undone."
 *   variant="destructive"
 *   onConfirm={handleDelete}
 *   isLoading={isDeleting}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isLoading = false,
  variant = "default",
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook to manage confirm dialog state
 */
export function useConfirmDialog() {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const openDialog = React.useCallback(() => setOpen(true), []);
  const closeDialog = React.useCallback(() => setOpen(false), []);

  const confirm = React.useCallback(async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    open,
    isLoading,
    openDialog,
    closeDialog,
    setOpen,
    confirm,
  };
}
