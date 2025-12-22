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
 * Monaco Editor instance - the editor object returned by monaco.editor.create()
 * This is a simplified interface covering common use cases
 */
export interface MonacoEditorInstance {
  getValue: () => string;
  setValue: (value: string) => void;
  getModel: () => ITextModel | null;
  getPosition: () => IPosition | null;
  setPosition: (position: IPosition) => void;
  getSelection: () => ISelection | null;
  setSelection: (selection: ISelection | IRange) => void;
  focus: () => void;
  trigger: (source: string, handlerId: string, payload: unknown) => void;
  executeEdits: (
    source: string,
    edits: Array<{ range: IRange; text: string; forceMoveMarkers?: boolean }>
  ) => boolean;
  onDidChangeCursorPosition: (
    listener: (e: ICursorPositionChangedEvent) => void
  ) => IDisposable;
  onDidChangeModelContent: (
    listener: (e: IModelContentChangedEvent) => void
  ) => IDisposable;
  onDidFocusEditorText: (listener: () => void) => IDisposable;
  onDidBlurEditorText: (listener: () => void) => IDisposable;
  addCommand: (
    keybinding: number,
    handler: () => void,
    context?: string
  ) => string | null;
  updateOptions: (options: Monaco.editor.IEditorOptions) => void;
  layout: (dimension?: { width: number; height: number }) => void;
  dispose: () => void;
}

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
