/**
 * Type definitions for Monaco Editor
 * These provide type safety for editor instances without requiring the full monaco-editor types
 */

import type * as Monaco from "monaco-editor";

// Re-export commonly used types
export type IStandaloneCodeEditor = Monaco.editor.IStandaloneCodeEditor;
export type ITextModel = Monaco.editor.ITextModel;
export type IPosition = Monaco.IPosition;
export type IRange = Monaco.IRange;
export type IDisposable = Monaco.IDisposable;

// Editor instance type
export interface MonacoEditorInstance {
  getValue: () => string;
  setValue: (value: string) => void;
  getModel: () => ITextModel | null;
  getPosition: () => IPosition | null;
  setPosition: (position: IPosition) => void;
  focus: () => void;
  trigger: (source: string, handlerId: string, payload: unknown) => void;
  executeEdits: (
    source: string,
    edits: Array<{ range: IRange; text: string; forceMoveMarkers?: boolean }>
  ) => boolean;
  onDidChangeCursorPosition: (
    listener: (e: { position: IPosition }) => void
  ) => IDisposable;
  onDidChangeModelContent: (
    listener: (e: { changes: Array<{ text: string; range: IRange }> }) => void
  ) => IDisposable;
  addCommand: (
    keybinding: number,
    handler: () => void,
    context?: string
  ) => string | null;
  updateOptions: (options: Record<string, unknown>) => void;
  getSelection: () => string;
}

// Monaco namespace type
export interface MonacoNamespace {
  editor: typeof Monaco.editor;
  languages: typeof Monaco.languages;
  KeyCode: typeof Monaco.KeyCode;
  KeyMod: typeof Monaco.KeyMod;
  Range: typeof Monaco.Range;
}

// Inline completion provider types
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
