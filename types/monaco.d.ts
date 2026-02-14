/**
 * Type definitions for Monaco Editor
 * These provide type safety for editor instances without requiring the full monaco-editor types
 */

import type * as Monaco from "monaco-editor";

// Re-export commonly used types from Monaco
export type IStandaloneCodeEditor = Monaco.editor.IStandaloneCodeEditor;
export type ITextModel = Monaco.editor.ITextModel;
export type IPosition = Monaco.IPosition;
export type IRange = Monaco.IRange;
export type IDisposable = Monaco.IDisposable;
export type IModelContentChangedEvent = Monaco.editor.IModelContentChangedEvent;
export type ICursorPositionChangedEvent = Monaco.editor.ICursorPositionChangedEvent;
export type ISelection = Monaco.ISelection;

/**
 * Monaco Editor instance - uses the real IStandaloneCodeEditor type
 * for full compatibility with the Monaco Editor API
 */
export type MonacoEditorInstance = Monaco.editor.IStandaloneCodeEditor;

/**
 * Monaco namespace - the global monaco object
 */
export interface MonacoNamespace {
  editor: typeof Monaco.editor;
  languages: typeof Monaco.languages;
  KeyCode: typeof Monaco.KeyCode;
  KeyMod: typeof Monaco.KeyMod;
  Range: typeof Monaco.Range;
  Position: typeof Monaco.Position;
  Selection: typeof Monaco.Selection;
  Uri: typeof Monaco.Uri;
}

// Inline completion types for AI suggestions
export interface InlineCompletionItem {
  insertText: string;
  range: IRange;
  kind?: number;
  label?: string;
  detail?: string;
  documentation?: string;
  sortText?: string;
  filterText?: string;
  insertTextRules?: number;
}

export interface InlineCompletionList {
  items: InlineCompletionItem[];
  enableForwardStability?: boolean;
}

export interface InlineCompletionContext {
  triggerKind: number;
  selectedSuggestionInfo?: {
    range: IRange;
    text: string;
  };
}

export interface InlineCompletionProvider {
  provideInlineCompletions: (
    model: ITextModel,
    position: IPosition,
    context: InlineCompletionContext,
    token: { isCancellationRequested: boolean }
  ) => Promise<InlineCompletionList>;
  freeInlineCompletions?: (completions: InlineCompletionList) => void;
}

/**
 * Decoration types for editor highlights
 */
export interface EditorDecoration {
  range: IRange;
  options: {
    isWholeLine?: boolean;
    className?: string;
    glyphMarginClassName?: string;
    inlineClassName?: string;
    afterContentClassName?: string;
    beforeContentClassName?: string;
  };
}

/**
 * Text model change event
 */
export interface ModelContentChange {
  range: IRange;
  rangeOffset: number;
  rangeLength: number;
  text: string;
}
