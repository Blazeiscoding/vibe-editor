export interface TemplateFile {
  filename: string;
  fileExtension: string;
  content: string;
}

export interface PlaygroundData {
  id: string;
  name?: string;
  [key: string]: string | undefined;
}

export interface TemplateFolder {
  folderName: string;
  items: (TemplateFile | TemplateFolder)[];
}

// Union type for items in the file system
export type TemplateItem = TemplateFile | TemplateFolder;

export interface LoadingStepProps {
  currentStep: number;
  step: number;
  label: string;
}

export interface OpenFile extends TemplateFile {
  id: string;
  hasUnsavedChanges: boolean;
  content: string;
  originalContent: string;
}

