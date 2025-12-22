/**
 * Playground type definitions
 */

/**
 * A file in the template file system
 */
export interface TemplateFile {
  filename: string;
  fileExtension: string;
  content: string;
}

/**
 * A folder in the template file system containing files and subfolders
 */
export interface TemplateFolder {
  folderName: string;
  items: TemplateItem[];
}

/**
 * Union type for file system items
 */
export type TemplateItem = TemplateFile | TemplateFolder;

/**
 * Type guard to check if item is a file
 */
export function isTemplateFile(item: TemplateItem): item is TemplateFile {
  return "filename" in item && "fileExtension" in item;
}

/**
 * Type guard to check if item is a folder
 */
export function isTemplateFolder(item: TemplateItem): item is TemplateFolder {
  return "folderName" in item && "items" in item;
}

/**
 * Playground data from the database
 */
export interface PlaygroundData {
  id: string;
  title: string;
  description?: string | null;
  template: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  templateFiles?: TemplateFileRecord[];
}

/**
 * Template file record from database
 */
export interface TemplateFileRecord {
  id: string;
  content: TemplateFolder | string;
  createdAt: Date;
  updatedAt: Date;
  playgroundId: string;
}

/**
 * Result from getPlaygroundById
 */
export interface PlaygroundByIdResult {
  id?: string;
  title?: string;
  description?: string | null;
  template?: string;
  templateFiles: Array<{
    content: TemplateFolder | string;
  }>;
}

/**
 * Props for LoadingStep component
 */
export interface LoadingStepProps {
  currentStep: number;
  step: number;
  label: string;
}

/**
 * An open file in the editor with additional state
 */
export interface OpenFile extends TemplateFile {
  id: string;
  hasUnsavedChanges: boolean;
  content: string;
  originalContent: string;
}

/**
 * Editor file tab
 */
export interface EditorTab {
  id: string;
  file: TemplateFile;
  isActive: boolean;
  hasUnsavedChanges: boolean;
}

/**
 * File system path
 */
export type FilePath = string;

/**
 * Parse template file content from database
 */
export function parseTemplateContent(
  content: TemplateFolder | string
): TemplateFolder | null {
  if (typeof content === "string") {
    try {
      return JSON.parse(content) as TemplateFolder;
    } catch {
      return null;
    }
  }
  return content;
}
