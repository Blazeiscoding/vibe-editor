import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { WebContainer } from "@webcontainer/api";

interface UseTerminalProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  theme: "dark" | "light";
  webContainerInstance: WebContainer | null;
}

interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

const TERMINAL_THEMES: Record<"dark" | "light", TerminalTheme> = {
  dark: {
    background: "#09090B",
    foreground: "#FAFAFA",
    cursor: "#FAFAFA",
    cursorAccent: "#09090B",
    selection: "#27272A",
    black: "#18181B",
    red: "#EF4444",
    green: "#22C55E",
    yellow: "#EAB308",
    blue: "#3B82F6",
    magenta: "#A855F7",
    cyan: "#06B6D4",
    white: "#F4F4F5",
    brightBlack: "#3F3F46",
    brightRed: "#F87171",
    brightGreen: "#4ADE80",
    brightYellow: "#FDE047",
    brightBlue: "#60A5FA",
    brightMagenta: "#C084FC",
    brightCyan: "#22D3EE",
    brightWhite: "#FFFFFF",
  },
  light: {
    background: "#FFFFFF",
    foreground: "#18181B",
    cursor: "#18181B",
    cursorAccent: "#FFFFFF",
    selection: "#E4E4E7",
    black: "#18181B",
    red: "#DC2626",
    green: "#16A34A",
    yellow: "#CA8A04",
    blue: "#2563EB",
    magenta: "#9333EA",
    cyan: "#0891B2",
    white: "#F4F4F5",
    brightBlack: "#71717A",
    brightRed: "#EF4444",
    brightGreen: "#22C55E",
    brightYellow: "#EAB308",
    brightBlue: "#3B82F6",
    brightMagenta: "#A855F7",
    brightCyan: "#06B6D4",
    brightWhite: "#FAFAFA",
  },
};

export function useTerminal({ containerRef, theme, webContainerInstance }: UseTerminalProps) {
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Command history management
  const commandHistory = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const currentLine = useRef<string>("");
  const cursorPosition = useRef<number>(0);
  
  // Process references
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const currentProcess = useRef<any>(null); // WebContainerProcess type is complex/internal

  useEffect(() => {
    setIsClient(true);
  }, []);

  const writePrompt = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.write("\r\n$ ");
      currentLine.current = "";
      cursorPosition.current = 0;
    }
  }, []);

  const executeCommand = useCallback(
    async (command: string) => {
      if (!webContainerInstance || !terminalRef.current) return;

      // Add to history
      if (
        command.trim() &&
        commandHistory.current[commandHistory.current.length - 1] !== command
      ) {
        commandHistory.current.push(command);
      }
      historyIndex.current = -1;

      try {
        // Handle built-in commands
        if (command.trim() === "clear") {
          terminalRef.current.clear();
          writePrompt();
          return;
        }

        if (command.trim() === "history") {
          commandHistory.current.forEach((cmd, index) => {
            terminalRef.current!.writeln(`  ${index + 1}  ${cmd}`);
          });
          writePrompt();
          return;
        }

        if (command.trim() === "") {
          writePrompt();
          return;
        }

        // Parse command
        const parts = command.trim().split(" ");
        const cmd = parts[0];
        const args = parts.slice(1);

        // Execute in WebContainer
        terminalRef.current.writeln("");
        const process = await webContainerInstance.spawn(cmd, args, {
          terminal: {
            cols: terminalRef.current.cols,
            rows: terminalRef.current.rows,
          },
        });

        currentProcess.current = process;

        // Handle process output
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              terminalRef.current?.write(data);
            },
          })
        );

        // Wait for process to complete
        await process.exit;
        currentProcess.current = null;

        // Show new prompt
        writePrompt();
      } catch (error) {
        if (terminalRef.current) {
          terminalRef.current.writeln(`\r\nCommand not found: ${command}`);
          writePrompt();
        }
        currentProcess.current = null;
      }
    },
    [webContainerInstance, writePrompt]
  );

  const handleTerminalInput = useCallback(
    (data: string) => {
      if (!terminalRef.current) return;

      // Handle special characters
      switch (data) {
        case "\r": // Enter
          executeCommand(currentLine.current);
          break;

        case "\u007F": // Backspace
          if (cursorPosition.current > 0) {
            currentLine.current =
              currentLine.current.slice(0, cursorPosition.current - 1) +
              currentLine.current.slice(cursorPosition.current);
            cursorPosition.current--;

            // Update terminal display
            terminalRef.current.write("\b \b");
          }
          break;

        case "\u0003": // Ctrl+C
          if (currentProcess.current) {
            currentProcess.current.kill();
            currentProcess.current = null;
          }
          terminalRef.current.writeln("^C");
          writePrompt();
          break;

        case "\u001b[A": // Up arrow
          if (commandHistory.current.length > 0) {
            if (historyIndex.current === -1) {
              historyIndex.current = commandHistory.current.length - 1;
            } else if (historyIndex.current > 0) {
              historyIndex.current--;
            }

            // Clear current line and write history command
            const historyCommand =
              commandHistory.current[historyIndex.current];
            terminalRef.current.write(
              "\r$ " + " ".repeat(currentLine.current.length) + "\r$ "
            );
            terminalRef.current.write(historyCommand);
            currentLine.current = historyCommand;
            cursorPosition.current = historyCommand.length;
          }
          break;

        case "\u001b[B": // Down arrow
          if (historyIndex.current !== -1) {
            if (historyIndex.current < commandHistory.current.length - 1) {
              historyIndex.current++;
              const historyCommand =
                commandHistory.current[historyIndex.current];
              terminalRef.current.write(
                "\r$ " + " ".repeat(currentLine.current.length) + "\r$ "
              );
              terminalRef.current.write(historyCommand);
              currentLine.current = historyCommand;
              cursorPosition.current = historyCommand.length;
            } else {
              historyIndex.current = -1;
              terminalRef.current.write(
                "\r$ " + " ".repeat(currentLine.current.length) + "\r$ "
              );
              currentLine.current = "";
              cursorPosition.current = 0;
            }
          }
          break;

        default:
          // Regular character input
          if (data >= " " || data === "\t") {
            currentLine.current =
              currentLine.current.slice(0, cursorPosition.current) +
              data +
              currentLine.current.slice(cursorPosition.current);
            cursorPosition.current++;
            terminalRef.current.write(data);
          }
          break;
      }
    },
    [executeCommand, writePrompt]
  );

  const initTerminal = useCallback(async () => {
    if (!containerRef.current || terminalRef.current || !isClient) return;

    try {
      const terminal = new Terminal({
        cursorBlink: true,
        fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        letterSpacing: 0,
        theme: TERMINAL_THEMES[theme],
        allowTransparency: false,
        convertEol: true,
        scrollback: 1000,
        tabStopWidth: 4,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      const searchAddon = new SearchAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      terminal.loadAddon(searchAddon);

      terminal.open(containerRef.current);
      
      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;
      searchAddonRef.current = searchAddon;

      terminal.onData(handleTerminalInput);

      setTimeout(() => {
        fitAddon.fit();
      }, 100);

      terminal.writeln("🚀 WebContainer Terminal");
      terminal.writeln("Type 'help' for available commands");
      writePrompt();

      return terminal;
    } catch (error) {
      console.error("Failed to initialize terminal:", error);
    }
  }, [theme, containerRef, isClient, handleTerminalInput, writePrompt]);

  const connectToWebContainer = useCallback(async () => {
    if (!webContainerInstance || !terminalRef.current) return;

    try {
      setIsConnected(true);
      terminalRef.current.writeln("✅ Connected to WebContainer");
      terminalRef.current.writeln("Ready to execute commands");
      writePrompt();
    } catch (error) {
      setIsConnected(false);
      terminalRef.current.writeln("❌ Failed to connect to WebContainer");
      console.error("WebContainer connection error:", error);
    }
  }, [webContainerInstance, writePrompt]);

  useEffect(() => {
    if (isClient) {
      initTerminal();
    }
  }, [isClient, initTerminal]);

  useEffect(() => {
    if (webContainerInstance && terminalRef.current && !isConnected) {
      connectToWebContainer();
    }
  }, [webContainerInstance, connectToWebContainer, isConnected]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
       if (fitAddonRef.current) {
         fitAddonRef.current.fit();
       }
    };
    
    // Add resize listener to window as well as observer
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      // Debounce fit
      requestAnimationFrame(() => {
         if (fitAddonRef.current) {
           fitAddonRef.current.fit();
         }
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (currentProcess.current) {
        currentProcess.current.kill(); // Kill process on unmount
      }
      terminalRef.current?.dispose();
      terminalRef.current = null;
    };
  }, [containerRef]);

  // API Methods
  const clearTerminal = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.clear();
      terminalRef.current.writeln("🚀 WebContainer Terminal");
      writePrompt();
    }
  }, [writePrompt]);

  const writeToTerminal = useCallback((data: string) => {
    terminalRef.current?.write(data);
  }, []);

  const focusTerminal = useCallback(() => {
    terminalRef.current?.focus();
  }, []);

  const searchInTerminal = useCallback((term: string) => {
    searchAddonRef.current?.findNext(term);
  }, []);

  const copyTerminalContent = useCallback(async () => {
      if (terminalRef.current) {
        const content = terminalRef.current.getSelection();
        if (content) {
          try {
            await navigator.clipboard.writeText(content);
          } catch (error) {
            console.error("Failed to copy to clipboard:", error);
          }
        }
      }
    }, []);

    const downloadTerminalLog = useCallback(() => {
      if (terminalRef.current) {
        const buffer = terminalRef.current.buffer.active;
        let content = "";

        for (let i = 0; i < buffer.length; i++) {
          const line = buffer.getLine(i);
          if (line) {
            content += line.translateToString(true) + "\n";
          }
        }

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `terminal-log-${new Date()
          .toISOString()
          .slice(0, 19)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, []);


  return {
    terminalInstance: terminalRef.current,
    isConnected,
    isClient,
    clearTerminal,
    writeToTerminal,
    focusTerminal,
    searchInTerminal,
    copyTerminalContent,
    downloadTerminalLog,
  };
}
