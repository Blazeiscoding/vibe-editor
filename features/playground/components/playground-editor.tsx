"use client";

import dynamic from "next/dynamic";
import type * as Monaco from "monaco-editor";

import {
  defaultEditorOptions,
  getEditorLanguage,
} from "@/features/playground/libs/editor-config";
import type { TemplateFile } from "@/features/playground/libs/path-to-json";
import { useEditorSuggestions } from "@/features/playground/hooks/use-editor-suggestions";
import type { MonacoEditorInstance, MonacoNamespace } from "@/types/monaco";

import { EditorSkeleton } from "@/components/loading/editor-skeleton";

// Dynamically import Monaco Editor with no SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

interface PlaygroundEditorProps {
  activeFile: TemplateFile | undefined;
  content: string;
  onContentChange: (value: string) => void;
  suggestion: string | null;
  suggestionLoading: boolean;
  suggestionPosition: { line: number; column: number } | null;
  onAcceptSuggestion: (editor: MonacoEditorInstance, monaco: MonacoNamespace) => void;
  onRejectSuggestion: (editor: MonacoEditorInstance) => void;
  onTriggerSuggestion: (type: string, editor: MonacoEditorInstance) => void;
}

export const PlaygroundEditor = ({
  activeFile,
  content,
  onContentChange,
  suggestion,
  suggestionLoading,
  suggestionPosition,
  onAcceptSuggestion,
  onRejectSuggestion,
  onTriggerSuggestion,
}: PlaygroundEditorProps) => {
  const { handleEditorDidMount, hasCurrentSuggestion } = useEditorSuggestions({
    activeFile,
    suggestion,
    suggestionLoading,
    suggestionPosition,
    onAcceptSuggestion,
    onRejectSuggestion,
    onTriggerSuggestion,
  });

  return (
    <div className="h-full relative">
      {/* Active suggestion indicator */}
      {hasCurrentSuggestion && !suggestionLoading && (
        <div className="absolute top-2 right-2 z-10 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Press Tab to accept
        </div>
      )}

      <MonacoEditor
        height="100%"
        value={content}
        onChange={(value: string | undefined) => onContentChange(value || "")}
        onMount={handleEditorDidMount}
        language={
          activeFile
            ? getEditorLanguage(activeFile.fileExtension || "")
            : "plaintext"
        }
        options={defaultEditorOptions as Monaco.editor.IStandaloneEditorConstructionOptions}
      />
    </div>
  );
};
