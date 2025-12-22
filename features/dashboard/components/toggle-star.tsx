"use client";

import { Button } from "@/components/ui/button";
import { useToggleStarMutation } from "@/hooks/queries/use-projects";
import { StarIcon, StarOffIcon, Loader2 } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";

interface MarkedToggleButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  markedForRevision: boolean;
  id: string;
}

export const MarkedToggleButton = forwardRef<HTMLButtonElement, MarkedToggleButtonProps>(
  ({ markedForRevision, id, onClick, className, children, ...props }, ref) => {
    const toggleMutation = useToggleStarMutation();

    const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Call the original onClick if provided by the parent (DropdownMenuItem)
      onClick?.(event);

      toggleMutation.mutate({
        playgroundId: id,
        isMarked: !markedForRevision,
      });
    };

    // Use optimistic state from mutation if pending, otherwise use prop
    const isMarked = toggleMutation.isPending
      ? !markedForRevision // Show optimistic state while pending
      : markedForRevision;

    return (
      <Button
        ref={ref}
        variant="ghost"
        className={`flex items-center justify-start w-full px-2 py-1.5 text-sm rounded-md cursor-pointer ${className}`}
        onClick={handleToggle}
        disabled={toggleMutation.isPending}
        {...props}
      >
        {toggleMutation.isPending ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : isMarked ? (
          <StarIcon size={16} className="text-yellow-500 fill-yellow-500 mr-2" />
        ) : (
          <StarOffIcon size={16} className="text-gray-500 mr-2" />
        )}
        {children || (isMarked ? "Remove Favorite" : "Add to Favorite")}
      </Button>
    );
  }
);

MarkedToggleButton.displayName = "MarkedToggleButton";
