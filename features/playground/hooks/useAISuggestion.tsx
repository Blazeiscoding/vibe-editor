import { useState, useCallback } from "react";
import { loggers } from "@/lib/logger";

const log = loggers.suggestions;

interface AISuggestionsState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number } | null;
  decoration: string[];
  isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
  toggleEnabled: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchSuggestion: (type: string, editor: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  acceptSuggestion: (editor: any, monaco: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rejectSuggestion: (editor: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearSuggestion: (editor: any) => void;
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const [state, setState] = useState<AISuggestionsState>({
    suggestion: null,
    isLoading: false,
    position: null,
    decoration: [],
    isEnabled: true,
  });

  const toggleEnabled = useCallback(() => {
    log.debug("Toggling AI suggestions");
    setState((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchSuggestion = useCallback(async (type: string, editor: any) => {
    log.debug("Fetching AI suggestion", { isEnabled: state.isEnabled, hasEditor: !!editor });

    // Use functional state update to get fresh state
    setState((currentState) => {
      if (!currentState.isEnabled) {
        log.debug("AI suggestions are disabled");
        return currentState;
      }

      if (!editor) {
        log.debug("Editor instance is not available");
        return currentState;
      }

      const model = editor.getModel();
      const cursorPosition = editor.getPosition();

      if (!model || !cursorPosition) {
        log.debug("Editor model or cursor position is not available");
        return currentState;
      }

      // Set loading state immediately
      const newState = { ...currentState, isLoading: true };

      // Perform the async operation
      (async () => {
        try {
          const payload = {
            fileContent: model.getValue(),
            cursorLine: cursorPosition.lineNumber - 1,
            cursorColumn: cursorPosition.column - 1,
            suggestionType: type,
          };
          log.debug("Request payload", payload);

          const response = await fetch("/api/code-suggestion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
          }

          const data = await response.json();
          log.debug("API response", { hasSuggestion: !!data.suggestion });

          if (data.suggestion) {
            const suggestionText = data.suggestion.trim();
            setState((prev) => ({
              ...prev,
              suggestion: suggestionText,
              position: {
                line: cursorPosition.lineNumber,
                column: cursorPosition.column,
              },
              isLoading: false,
            }));
          } else {
            log.debug("No suggestion received from API");
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        } catch (error) {
          log.error("Error fetching code suggestion", { error });
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      })();

      return newState;
    });
  }, []); // Remove state.isEnabled from dependencies to prevent stale closures

  const acceptSuggestion = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor: any, monaco: any) => {
      setState((currentState) => {
        if (!currentState.suggestion || !currentState.position || !editor || !monaco) {
          return currentState;
        }

        const { line, column } = currentState.position;
        const sanitizedSuggestion = currentState.suggestion.replace(/^\d+:\s*/gm, "");

        editor.executeEdits("", [
          {
            range: new monaco.Range(line, column, line, column),
            text: sanitizedSuggestion,
            forceMoveMarkers: true,
          },
        ]);

        // Clear decorations
        if (editor && currentState.decoration.length > 0) {
          editor.deltaDecorations(currentState.decoration, []);
        }

        return {
          ...currentState,
          suggestion: null,
          position: null,
          decoration: [],
        };
      });
    },
    []
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rejectSuggestion = useCallback((editor: any) => {
    setState((currentState) => {
      if (editor && currentState.decoration.length > 0) {
        editor.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clearSuggestion = useCallback((editor: any) => {
    setState((currentState) => {
      if (editor && currentState.decoration.length > 0) {
        editor.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  };
};