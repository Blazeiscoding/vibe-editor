"use client";

import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Copy, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { WebContainer } from "@webcontainer/api";
import { useTerminal } from "../hooks/useTerminal";

interface TerminalProps {
  webcontainerUrl?: string;
  className?: string;
  theme?: "dark" | "light";
  webContainerInstance?: WebContainer | null;
}

// Define the methods that will be exposed through the ref
export interface TerminalRef {
  writeToTerminal: (data: string) => void;
  clearTerminal: () => void;
  focusTerminal: () => void;
}

const TerminalComponent = forwardRef<TerminalRef, TerminalProps>(
  ({ className, theme = "dark", webContainerInstance }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [showSearch, setShowSearch] = React.useState(false);

    const {
      isConnected,
      isClient,
      clearTerminal,
      writeToTerminal,
      focusTerminal,
      searchInTerminal,
      copyTerminalContent,
      downloadTerminalLog,
    } = useTerminal({
      containerRef,
      theme,
      webContainerInstance: webContainerInstance || null,
    });

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      writeToTerminal,
      clearTerminal,
      focusTerminal,
    }));

    // Show loading state while client-side rendering
    if (!isClient) {
      return (
        <div
          className={cn(
            "flex flex-col h-full bg-background border rounded-lg overflow-hidden",
            className
          )}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading terminal...</div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-col h-full bg-background border rounded-lg overflow-hidden",
          className
        )}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-sm font-medium">WebContainer Terminal</span>
            {isConnected && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {showSearch && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchInTerminal(e.target.value);
                  }}
                  className="h-6 w-32 text-xs"
                />
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="h-6 w-6 p-0"
            >
              <Search className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={copyTerminalContent}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTerminalLog}
              className="h-6 w-6 p-0"
            >
              <Download className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearTerminal}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 p-2 bg-[#09090B]" ref={containerRef} />
        </div>
      </div>
    );
  }
);

TerminalComponent.displayName = "TerminalComponent";

export default TerminalComponent;
