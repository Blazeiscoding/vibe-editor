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
    if (activeFile) {
      activeFile.content = value;
    }
  };

  const handleAcceptSuggestion = (_editor: MonacoEditorInstance, _monaco: MonacoNamespace) => {
    setSuggestion(null);
  };

  const handleRejectSuggestion = (_editor: MonacoEditorInstance) => {
    setSuggestion(null);
  };

  const handleTriggerSuggestion = (_type: string, _editor: MonacoEditorInstance) => {
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
