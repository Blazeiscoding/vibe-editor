"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Keyboard,
  Code,
  Search,
  FileCode,
  Settings,
  Plus,
  Github,
} from "lucide-react";

interface KeyboardShortcutsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shortcut {
  category: string;
  icon: React.ReactNode;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

export function KeyboardShortcuts({
  open,
  onOpenChange,
}: KeyboardShortcutsProps) {
  const shortcuts: Shortcut[] = [
    {
      category: "General",
      icon: <Keyboard className="h-4 w-4" />,
      shortcuts: [
        { keys: ["Ctrl", "K"], description: "Open command palette" },
        { keys: ["/"], description: "Open command palette" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["Esc"], description: "Close dialogs/modals" },
      ],
    },
    {
      category: "Editor",
      icon: <Code className="h-4 w-4" />,
      shortcuts: [
        { keys: ["Ctrl", "Space"], description: "Trigger AI suggestion" },
        { keys: ["Tab"], description: "Accept AI suggestion" },
        { keys: ["Ctrl", "S"], description: "Save file" },
        { keys: ["Ctrl", "F"], description: "Find in file" },
        { keys: ["Ctrl", "H"], description: "Replace in file" },
        { keys: ["Ctrl", "/"], description: "Toggle comment" },
      ],
    },
    {
      category: "Navigation",
      icon: <FileCode className="h-4 w-4" />,
      shortcuts: [
        { keys: ["Ctrl", "P"], description: "Quick file open" },
        { keys: ["Ctrl", "B"], description: "Toggle sidebar" },
        { keys: ["Ctrl", "`"], description: "Toggle terminal" },
      ],
    },
    {
      category: "Actions",
      icon: <Plus className="h-4 w-4" />,
      shortcuts: [
        { keys: ["Ctrl", "N"], description: "New project" },
        { keys: ["Ctrl", "G"], description: "Import from GitHub" },
        { keys: ["Ctrl", ","], description: "Open settings" },
      ],
    },
  ];

  const renderKeys = (keys: string[]) => {
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="mx-1 text-muted-foreground">+</span>
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            All available keyboard shortcuts in Vibe Editor
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {shortcuts.map((category) => (
            <div key={category.category} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {category.icon}
                <span>{category.category}</span>
              </div>
              <div className="space-y-2 pl-6">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    {renderKeys(shortcut.keys)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
          <p>
            Tip: You can customize these shortcuts in Settings → Keyboard
            Shortcuts
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

