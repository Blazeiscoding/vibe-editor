"use client";
import React, { useState } from "react";
import { PlaygroundEditor } from "./playground-editor";
import type {
  TemplateItem,
  TemplateFile,
} from "@/features/playground/types";
interface PlaygroundEditorClientProps {
  templateData: TemplateItem;
}

const PlaygroundEditorClient: React.FC<PlaygroundEditorClientProps> = ({
  templateData,
}) => {
  const [activeFile, setActiveFile] = useState<TemplateFile | undefined>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "items" in (templateData as any) &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (templateData as any).items.length > 0 &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "content" in (templateData as any).items[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ((templateData as any).items[0] as TemplateFile)
      : undefined
  );
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAcceptSuggestion = (editor: any, monaco: any) => {
    setSuggestion(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRejectSuggestion = (editor: any) => {
    setSuggestion(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTriggerSuggestion = (type: string, editor: any) => {
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
