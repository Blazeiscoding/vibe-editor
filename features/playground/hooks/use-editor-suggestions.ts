import { useRef, useCallback, useEffect, useState } from "react";
import type { TemplateFile } from "@/features/playground/libs/path-to-json";
import { getEditorLanguage, configureMonaco, defaultEditorOptions } from "@/features/playground/libs/editor-config";
import type {
  MonacoEditorInstance,
  MonacoNamespace,
  ITextModel,
  IPosition,
  InlineCompletionContext,
  InlineCompletionList,
  IDisposable,
  ICursorPositionChangedEvent,
  IModelContentChangedEvent,
} from "@/types/monaco";

interface UseEditorSuggestionsProps {
  activeFile: TemplateFile | undefined;
  suggestion: string | null;
  suggestionLoading: boolean;
  suggestionPosition: { line: number; column: number } | null;
  onAcceptSuggestion: (editor: MonacoEditorInstance, monaco: MonacoNamespace) => void;
  onRejectSuggestion: (editor: MonacoEditorInstance) => void;
  onTriggerSuggestion: (type: string, editor: MonacoEditorInstance) => void;
}

export const useEditorSuggestions = ({
  activeFile,
  suggestion,
  suggestionLoading,
  suggestionPosition,
  onAcceptSuggestion,
  onRejectSuggestion,
  onTriggerSuggestion,
}: UseEditorSuggestionsProps) => {
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const monacoRef = useRef<MonacoNamespace | null>(null);
  const inlineCompletionProviderRef = useRef<IDisposable | null>(null);
  
  const currentSuggestionRef = useRef<{
    text: string;
    position: { line: number; column: number };
    id: string;
  } | null>(null);

  // We need state to trigger re-renders for the UI indicator
  const [hasCurrentSuggestion, setHasCurrentSuggestion] = useState(false);

  const isAcceptingSuggestionRef = useRef(false);
  const suggestionAcceptedRef = useRef(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabCommandRef = useRef<string | null>(null);

  const updateCurrentSuggestion = (val: typeof currentSuggestionRef.current) => {
    currentSuggestionRef.current = val;
    setHasCurrentSuggestion(!!val);
  };

  // Generate unique ID for each suggestion
  const generateSuggestionId = () =>
    `suggestion-${Date.now()}-${Math.random()}`;

  // Create inline completion provider
  const createInlineCompletionProvider = useCallback(
    (monaco: MonacoNamespace) => {
      return {
        provideInlineCompletions: async (
          model: ITextModel,
          position: IPosition,
          context: InlineCompletionContext,
          token: { isCancellationRequested: boolean }
        ): Promise<InlineCompletionList> => {
          // Don't provide completions if we're currently accepting or have already accepted
          if (
            isAcceptingSuggestionRef.current ||
            suggestionAcceptedRef.current
          ) {
            return { items: [] };
          }

          // Only provide suggestion if we have one
          if (!suggestion || !suggestionPosition) {
            return { items: [] };
          }

          // Check if current position matches suggestion position (with some tolerance)
          const currentLine = position.lineNumber;
          const currentColumn = position.column;

          const isPositionMatch =
            currentLine === suggestionPosition.line &&
            currentColumn >= suggestionPosition.column &&
            currentColumn <= suggestionPosition.column + 2; // Small tolerance

          if (!isPositionMatch) {
            return { items: [] };
          }

          const suggestionId = generateSuggestionId();
          updateCurrentSuggestion({
            text: suggestion,
            position: suggestionPosition,
            id: suggestionId,
          });

          // Clean the suggestion text (remove \r characters)
          const cleanSuggestion = suggestion.replace(/\r/g, "");

          return {
            items: [
              {
                insertText: cleanSuggestion,
                range: new monaco.Range(
                  suggestionPosition.line,
                  suggestionPosition.column,
                  suggestionPosition.line,
                  suggestionPosition.column
                ),
                kind: monaco.languages.CompletionItemKind.Snippet,
                label: "AI Suggestion",
                detail: "AI-generated code suggestion",
                documentation: "Press Tab to accept",
                sortText: "0000", // High priority
                filterText: "",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              },
            ],
          };
        },
        freeInlineCompletions: (_completions: InlineCompletionList) => {
           // Cleanup if needed
        },
        disposeInlineCompletions: (_completions: InlineCompletionList) => {
           // Cleanup if needed
        },
      };
    },
    [suggestion, suggestionPosition]
  );

  // Clear current suggestion
  const clearCurrentSuggestion = useCallback(() => {
    updateCurrentSuggestion(null);
    suggestionAcceptedRef.current = false;
    if (editorRef.current) {
      editorRef.current.trigger("ai", "editor.action.inlineSuggest.hide", null);
    }
  }, []);

  // Accept current suggestion with double-acceptance prevention
  const acceptCurrentSuggestion = useCallback(() => {
    if (
      !editorRef.current ||
      !monacoRef.current ||
      !currentSuggestionRef.current
    ) {
      return false;
    }

    // CRITICAL: Prevent double acceptance with immediate flag setting
    if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
      return false;
    }

    // Set flags IMMEDIATELY to prevent any race conditions
    isAcceptingSuggestionRef.current = true;
    suggestionAcceptedRef.current = true;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const currentSuggestion = currentSuggestionRef.current;

    try {
      // Clean the suggestion text (remove \r characters)
      const cleanSuggestionText = currentSuggestion.text.replace(/\r/g, "");

      // Get current cursor position to validate
      const currentPosition = editor.getPosition();
      const suggestionPos = currentSuggestion.position;

      // Verify we're still at the suggestion position
      if (
        !currentPosition ||
        currentPosition.lineNumber !== suggestionPos.line ||
        currentPosition.column < suggestionPos.column ||
        currentPosition.column > suggestionPos.column + 5
      ) {
        return false;
      }

      // Insert the suggestion text at the correct position
      const range = new monaco.Range(
        suggestionPos.line,
        suggestionPos.column,
        suggestionPos.line,
        suggestionPos.column
      );

      // Use executeEdits to insert the text
      const success = editor.executeEdits("ai-suggestion-accept", [
        {
          range: range,
          text: cleanSuggestionText,
          forceMoveMarkers: true,
        },
      ]);

      if (!success) {
        console.error("Failed to execute edit");
        return false;
      }

      // Calculate new cursor position
      const lines = cleanSuggestionText.split("\n");
      const endLine = suggestionPos.line + lines.length - 1;
      const endColumn =
        lines.length === 1
          ? suggestionPos.column + cleanSuggestionText.length
          : lines[lines.length - 1].length + 1;

      // Move cursor to end of inserted text
      editor.setPosition({ lineNumber: endLine, column: endColumn });

      // Clear the suggestion
      clearCurrentSuggestion();

      // Call the parent's accept handler
      onAcceptSuggestion(editor, monaco);

      return true;
    } catch (error) {
      console.error("Error accepting suggestion:", error);
      return false;
    } finally {
      // Reset accepting flag immediately
      isAcceptingSuggestionRef.current = false;

      // Keep accepted flag for longer to prevent immediate re-acceptance
      setTimeout(() => {
        suggestionAcceptedRef.current = false;
      }, 1000);
    }
  }, [clearCurrentSuggestion, onAcceptSuggestion]);

  // Check if there's an active inline suggestion at current position
  const hasActiveSuggestionAtPosition = useCallback(() => {
    if (!editorRef.current || !currentSuggestionRef.current) return false;

    const position = editorRef.current.getPosition();
    const suggestion = currentSuggestionRef.current;

    if (!position) return false;

    return (
      position.lineNumber === suggestion.position.line &&
      position.column >= suggestion.position.column &&
      position.column <= suggestion.position.column + 2
    );
  }, []);

  // Update inline completions when suggestion changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Don't update if we're in the middle of accepting a suggestion
    if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
      return;
    }

    // Dispose previous provider
    if (inlineCompletionProviderRef.current) {
      inlineCompletionProviderRef.current.dispose();
      inlineCompletionProviderRef.current = null;
    }

    // Clear current suggestion reference
    updateCurrentSuggestion(null);

    // Register new provider if we have a suggestion
    if (suggestion && suggestionPosition) {
      const language = getEditorLanguage(activeFile?.fileExtension || "");
      const provider = createInlineCompletionProvider(monaco);

      inlineCompletionProviderRef.current =
        monaco.languages.registerInlineCompletionsProvider(language, provider);

      // Small delay to ensure editor is ready, then trigger suggestions
      setTimeout(() => {
        if (
          editorRef.current &&
          !isAcceptingSuggestionRef.current &&
          !suggestionAcceptedRef.current
        ) {
          editor.trigger("ai", "editor.action.inlineSuggest.trigger", null);
        }
      }, 50);
    }

    return () => {
      if (inlineCompletionProviderRef.current) {
        inlineCompletionProviderRef.current.dispose();
        inlineCompletionProviderRef.current = null;
      }
    };
  }, [
    suggestion,
    suggestionPosition,
    activeFile,
    createInlineCompletionProvider,
  ]);

  const updateEditorLanguage = useCallback(() => {
    if (!activeFile || !monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const language = getEditorLanguage(activeFile.fileExtension || "");
    try {
      monacoRef.current.editor.setModelLanguage(model, language);
    } catch (error) {
      console.warn("Failed to set editor language:", error);
    }
  }, [activeFile]);

  useEffect(() => {
    updateEditorLanguage();
  }, [activeFile, updateEditorLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      if (inlineCompletionProviderRef.current) {
        inlineCompletionProviderRef.current.dispose();
        inlineCompletionProviderRef.current = null;
      }
      if (tabCommandRef.current) {
        tabCommandRef.current = null;
      }
    };
  }, []);

  // The main init function for the editor
  const handleEditorDidMount = useCallback((editor: MonacoEditorInstance, monaco: MonacoNamespace) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.updateOptions({
      ...defaultEditorOptions,
      // Enable inline suggestions but with specific settings to prevent conflicts
      inlineSuggest: {
        enabled: true,
        mode: "prefix",
        suppressSuggestions: false,
      },
      // Disable some conflicting suggest features
      suggest: {
        preview: false, // Disable preview to avoid conflicts
        showInlineDetails: false,
        insertMode: "replace",
      },
      // Quick suggestions
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      // Smooth cursor
      cursorSmoothCaretAnimation: "on",
    });

    configureMonaco(monaco);

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      onTriggerSuggestion("completion", editor);
    });

    // CRITICAL: Override Tab key with high priority and prevent default Monaco behavior
    if (tabCommandRef.current) {
      tabCommandRef.current = null;
    }

    tabCommandRef.current = editor.addCommand(
      monaco.KeyCode.Tab,
      () => {
        // CRITICAL: Block if already processing
        if (isAcceptingSuggestionRef.current) {
          return;
        }

        // CRITICAL: Block if just accepted
        if (suggestionAcceptedRef.current) {
          editor.trigger("keyboard", "tab", null);
          return;
        }

        // If we have an active suggestion at the current position, try to accept it
        if (currentSuggestionRef.current && hasActiveSuggestionAtPosition()) {
          const accepted = acceptCurrentSuggestion();
          if (accepted) {
            return; // CRITICAL: Return here to prevent default tab behavior
          }
        }

        // Default tab behavior (indentation)
        editor.trigger("keyboard", "tab", null);
      },
      // CRITICAL: Use specific context to override Monaco's built-in Tab handling
      "editorTextFocus && !editorReadonly && !suggestWidgetVisible"
    );

    // Escape to reject
    editor.addCommand(monaco.KeyCode.Escape, () => {
      if (currentSuggestionRef.current) {
        onRejectSuggestion(editor);
        clearCurrentSuggestion();
      }
    });

    // Listen for cursor position changes to hide suggestions when moving away
    editor.onDidChangeCursorPosition((e: ICursorPositionChangedEvent) => {
      if (isAcceptingSuggestionRef.current) return;

      const newPosition = e.position;

      // Clear existing suggestion if cursor moved away
      if (currentSuggestionRef.current && !suggestionAcceptedRef.current) {
        const suggestionPos = currentSuggestionRef.current.position;

        // If cursor moved away from suggestion position, clear it
        if (
          newPosition.lineNumber !== suggestionPos.line ||
          newPosition.column < suggestionPos.column ||
          newPosition.column > suggestionPos.column + 10
        ) {
          clearCurrentSuggestion();
          onRejectSuggestion(editor);
        }
      }

      // Trigger new suggestion if appropriate (simplified)
      if (!currentSuggestionRef.current && !suggestionLoading) {
        // Clear any existing timeout
        if (suggestionTimeoutRef.current) {
          clearTimeout(suggestionTimeoutRef.current);
        }

        // Trigger suggestion with a delay
        suggestionTimeoutRef.current = setTimeout(() => {
          onTriggerSuggestion("completion", editor);
        }, 300);
      }
    });

    // Listen for content changes to detect manual typing over suggestions
    editor.onDidChangeModelContent((e: IModelContentChangedEvent) => {
      if (isAcceptingSuggestionRef.current) return;

      // If user types while there's a suggestion, clear it (unless it's our insertion)
      if (
        currentSuggestionRef.current &&
        e.changes.length > 0 &&
        !suggestionAcceptedRef.current
      ) {
        const change = e.changes[0];

        // Check if this is our own suggestion insertion
        if (
          change.text === currentSuggestionRef.current.text ||
          change.text === currentSuggestionRef.current.text.replace(/\r/g, "")
        ) {
          return;
        }

        // User typed something else, clear the suggestion
        clearCurrentSuggestion();
      }

      // Trigger context-aware suggestions on certain typing patterns
      if (e.changes.length > 0 && !suggestionAcceptedRef.current) {
        const change = e.changes[0];

        // Trigger suggestions after specific characters
        if (
          change.text === "\n" || // New line
          change.text === "{" || // Opening brace
          change.text === "." || // Dot notation
          change.text === "=" || // Assignment
          change.text === "(" || // Function call
          change.text === "," || // Parameter separator
          change.text === ":" || // Object property
          change.text === ";" // Statement end
        ) {
          setTimeout(() => {
            if (
              editorRef.current &&
              !currentSuggestionRef.current &&
              !suggestionLoading
            ) {
              onTriggerSuggestion("completion", editor);
            }
          }, 100); // Small delay to let the change settle
        }
      }
    });

    updateEditorLanguage();
  }, [
    activeFile,
    updateEditorLanguage,
    clearCurrentSuggestion,
    hasActiveSuggestionAtPosition,
    acceptCurrentSuggestion,
    onRejectSuggestion,
    onTriggerSuggestion,
    suggestionLoading
  ]);

  return {
    handleEditorDidMount,
    hasCurrentSuggestion
  };
};
