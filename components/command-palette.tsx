"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Plus,
  Settings,
  Home,
  Github,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const commands = [
    {
      id: "new-project",
      label: "Create New Project",
      icon: Plus,
      action: () => {
        router.push("/dashboard?action=new");
        onOpenChange(false);
      },
      keywords: ["new", "create", "project", "playground"],
    },
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: Home,
      action: () => {
        router.push("/dashboard");
        onOpenChange(false);
      },
      keywords: ["dashboard", "home", "projects"],
    },
    {
      id: "import-github",
      label: "Import from GitHub",
      icon: Github,
      action: () => {
        router.push("/dashboard?action=import");
        onOpenChange(false);
      },
      keywords: ["import", "github", "repo", "repository"],
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      action: () => {
        router.push("/settings");
        onOpenChange(false);
      },
      keywords: ["settings", "preferences", "config"],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((keyword) => keyword.includes(searchLower))
    );
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "/" && !open) {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl">
        <Command className="rounded-lg border-none">
          <CommandInput
            placeholder="Type a command or search..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Commands">
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => cmd.action()}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{cmd.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Press Esc to close</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">
                    Enter
                  </kbd>
                  <span>Select</span>
                </span>
              </div>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

