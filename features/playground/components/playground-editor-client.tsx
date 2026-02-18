"use client";
import React, { useState } from "react";
import { PlaygroundEditor } from "./playground-editor";
import type {
  TemplateItem,
  TemplateFile,
  TemplateFolder,
} from "@/features/playground/types";
import type { MonacoEditorInstance, MonacoNamespace } from "@/types/monaco";

interface PlaygroundEditorClientProps {
  templateData: TemplateItem;
}

const PlaygroundEditorClient: React.FC<PlaygroundEditorClientProps> = ({
  templateData,
}) => {
  const [activeFile, setActiveFile] = useState<TemplateFile | undefined>(() => {
    if ("items" in templateData) {
      const folder = templateData as TemplateFolder;
      if (folder.items.length > 0 && "content" in folder.items[0]) {
        return folder.items[0] as TemplateFile;
      }
    }
    return undefined;
  });
  const [content, setContent] = useState(activeFile?.content || "");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState<{
    line: number;
    column: number;
  } | null>(null);

  const handleContentChange = (value: string) => {
    setContent(value);
    setActiveFile((current) =>
      current ? { ...current, content: value } : current
    );
  };

  const handleAcceptSuggestion = (
    editor: MonacoEditorInstance,
    monaco: MonacoNamespace
  ) => {
    void editor;
    void monaco;
    setSuggestion(null);
  };

  const handleRejectSuggestion = (editor: MonacoEditorInstance) => {
    void editor;
    setSuggestion(null);
  };

  const handleTriggerSuggestion = (type: string, editor: MonacoEditorInstance) => {
    void type;
    void editor;
    setSuggestionLoading(true);
    setTimeout(() => {
      setSuggestion("// Sample suggestion\n// Implement your logic here");
      setSuggestionPosition({ line: 1, column: 1 });
      setSuggestionLoading(false);
    }, 500);
  };

  return (
    <div className="h-screen">
      <PlaygroundEditor
        activeFile={activeFile}
        content={content}
        onContentChange={handleContentChange}
        suggestion={suggestion}
        suggestionLoading={suggestionLoading}
        suggestionPosition={suggestionPosition}
        onAcceptSuggestion={handleAcceptSuggestion}
        onRejectSuggestion={handleRejectSuggestion}
        onTriggerSuggestion={handleTriggerSuggestion}
      />
    </div>
  );
};

export default PlaygroundEditorClient;
