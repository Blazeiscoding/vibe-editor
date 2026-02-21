import { create } from "zustand";
import type { WebContainer } from "@webcontainer/api";

import { toast } from "sonner";
import { TemplateFile, TemplateFolder, OpenFile } from "../types";
import { generateFileId } from "../libs";
import { loggers } from "@/lib/logger";

const log = loggers.fileExplorer;

interface FileExplorerState {
  playgroundId: string;
  templateData: TemplateFolder | null;
  openFiles: OpenFile[];
  activeFileId: string | null;
  editorContent: string;
  saveTemplateData: ((data: TemplateFolder) => Promise<void>) | null;

  // Actions
  setPlaygroundId: (id: string) => void;
  setTemplateData: (data: TemplateFolder | null) => void;
  setEditorContent: (content: string) => void;
  setOpenFiles: (files: OpenFile[]) => void;
  setActiveFileId: (fileId: string | null) => void;
  setSaveTemplateData: (fn: (data: TemplateFolder) => Promise<void>) => void;
  openFile: (file: TemplateFile) => void;
  closeFile: (fileId: string) => void;
  closeAllFiles: () => void;
  handleAddFile: (
    newFile: TemplateFile,
    parentPath: string,
    writeFileSync: (filePath: string, content: string) => Promise<void>
  ) => Promise<void>;
  handleAddFolder: (
    newFolder: TemplateFolder, 
    parentPath: string, 
    instance: WebContainer | null
  ) => Promise<void>;
  handleDeleteFile: (
    file: TemplateFile, 
    parentPath: string
  ) => Promise<void>;
  handleDeleteFolder: (
    folder: TemplateFolder,
    parentPath: string
  ) => Promise<void>;
  handleRenameFile: (
    file: TemplateFile,
    newFilename: string,
    newExtension: string,
    parentPath: string
  ) => Promise<void>;
  handleRenameFolder: (
    folder: TemplateFolder,
    newFolderName: string,
    parentPath: string
  ) => Promise<void>;
  updateFileContent: (fileId: string, content: string) => void;
}


export const useFileExplorer = create<FileExplorerState>((set, get) => ({
  templateData: null,
  playgroundId: "",
  openFiles: [] satisfies OpenFile[],
  activeFileId: null,
  editorContent: "",
  saveTemplateData: null,

  setTemplateData: (data) => set({ templateData: data }),
  setPlaygroundId(id) {
    set({ playgroundId: id });
  },
  setEditorContent: (content) => set({ editorContent: content }),
  setOpenFiles: (files) => set({ openFiles: files }),
  setActiveFileId: (fileId) => set({ activeFileId: fileId }),
  setSaveTemplateData: (fn) => set({ saveTemplateData: fn }),

  openFile: (file) => {
    const fileId = generateFileId(file, get().templateData!);
    const { openFiles } = get();
    const existingFile = openFiles.find((f) => f.id === fileId);

    if (existingFile) {
      set({ activeFileId: fileId, editorContent: existingFile.content });
      return;
    }

    const newOpenFile: OpenFile = {
      ...file,
      id: fileId,
      hasUnsavedChanges: false,
      content: file.content || "",
      originalContent: file.content || "",
    };

    set((state) => ({
      openFiles: [...state.openFiles, newOpenFile],
      activeFileId: fileId,
      editorContent: file.content || "",
    }));
  },

  closeFile: (fileId) => {
    const { openFiles, activeFileId } = get();
    const newFiles = openFiles.filter((f) => f.id !== fileId);
    
    // If we're closing the active file, switch to another file or clear active
    let newActiveFileId = activeFileId;
    let newEditorContent = get().editorContent;
    
    if (activeFileId === fileId) {
      if (newFiles.length > 0) {
        // Switch to the last file in the list
        const lastFile = newFiles[newFiles.length - 1];
        newActiveFileId = lastFile.id;
        newEditorContent = lastFile.content;
      } else {
        // No files left
        newActiveFileId = null;
        newEditorContent = "";
      }
    }

    set({
      openFiles: newFiles,
      activeFileId: newActiveFileId,
      editorContent: newEditorContent,
    });
  },

  closeAllFiles: () => {
    set({
      openFiles: [],
      activeFileId: null,
      editorContent: "",
    });
  },

  handleAddFile: async (newFile, parentPath, writeFileSync) => {
    const { templateData, saveTemplateData } = get();
    if (!templateData || !saveTemplateData) return;

    try {
      const updatedTemplateData = JSON.parse(JSON.stringify(templateData)) as TemplateFolder;
      const pathParts = parentPath.split("/");
      let currentFolder = updatedTemplateData;

      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            (item) => "folderName" in item && item.folderName === part
          ) as TemplateFolder;
          if (nextFolder) currentFolder = nextFolder;
        }
      }

      currentFolder.items.push(newFile);
      set({ templateData: updatedTemplateData });
      toast.success(`Created file: ${newFile.filename}.${newFile.fileExtension}`);

      await saveTemplateData(updatedTemplateData);

      // Sync with web container
      if (writeFileSync) {
        const filePath = parentPath
          ? `${parentPath}/${newFile.filename}.${newFile.fileExtension}`
          : `${newFile.filename}.${newFile.fileExtension}`;
        await writeFileSync(filePath, newFile.content || "");
      }

      get().openFile(newFile);
    } catch (error) {
      log.error("Error adding file", { error });
      toast.error("Failed to create file");
    }
  },

  handleAddFolder: async (newFolder, parentPath, instance) => {
    const { templateData, saveTemplateData } = get();
    if (!templateData || !saveTemplateData) return;

    try {
      const updatedTemplateData = JSON.parse(JSON.stringify(templateData)) as TemplateFolder;
      const pathParts = parentPath.split("/");
      let currentFolder = updatedTemplateData;

      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            (item) => "folderName" in item && item.folderName === part
          ) as TemplateFolder;
          if (nextFolder) currentFolder = nextFolder;
        }
      }

      currentFolder.items.push(newFolder);
      set({ templateData: updatedTemplateData });
      toast.success(`Created folder: ${newFolder.folderName}`);

      await saveTemplateData(updatedTemplateData);

      // Sync with web container
      if (instance && instance.fs) {
        const folderPath = parentPath
          ? `${parentPath}/${newFolder.folderName}`
          : newFolder.folderName;
        await instance.fs.mkdir(folderPath, { recursive: true });
      }
    } catch (error) {
      log.error("Error adding folder", { error });
      toast.error("Failed to create folder");
    }
  },

  handleDeleteFile: async (file, parentPath) => {
    const { templateData, openFiles, saveTemplateData } = get();
    if (!templateData || !saveTemplateData) return;

    try {
      const updatedTemplateData = JSON.parse(
        JSON.stringify(templateData)
      ) as TemplateFolder;
      const pathParts = parentPath.split("/");
      let currentFolder = updatedTemplateData;

      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            (item) => "folderName" in item && item.folderName === part
          ) as TemplateFolder;
          if (nextFolder) currentFolder = nextFolder;
        }
      }

      currentFolder.items = currentFolder.items.filter(
        (item) =>
          !("filename" in item) ||
          item.filename !== file.filename ||
          item.fileExtension !== file.fileExtension
      );

      // Find and close the file if it's open
      // Use the same ID generation logic as in openFile
      const fileId = generateFileId(file, templateData);
      const openFile = openFiles.find((f) => f.id === fileId);
      
      if (openFile) {
        // Close the file using the closeFile method
        get().closeFile(fileId);
      }

      set({ templateData: updatedTemplateData });

      await saveTemplateData(updatedTemplateData);
      toast.success(`Deleted file: ${file.filename}.${file.fileExtension}`);
    } catch (error) {
      log.error("Error deleting file", { error });
      toast.error("Failed to delete file");
    }
  },

  handleDeleteFolder: async (folder, parentPath) => {
    const { templateData, saveTemplateData } = get();
    if (!templateData || !saveTemplateData) return;

    try {
      const updatedTemplateData = JSON.parse(
        JSON.stringify(templateData)
      ) as TemplateFolder;
      const pathParts = parentPath.split("/");
      let currentFolder = updatedTemplateData;

      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            (item) => "folderName" in item && item.folderName === part
          ) as TemplateFolder;
          if (nextFolder) currentFolder = nextFolder;
        }
      }

      currentFolder.items = currentFolder.items.filter(
        (item) =>
          !("folderName" in item) || item.folderName !== folder.folderName
      );

      // Close all files in the deleted folder recursively
      const closeFilesInFolder = (folder: TemplateFolder, currentPath: string = "") => {
        folder.items.forEach((item) => {
          if ("filename" in item) {
            // Generate the correct file ID using the same logic as openFile
            const fileId = generateFileId(item, templateData);
            get().closeFile(fileId);
          } else if ("folderName" in item) {
            const newPath = currentPath ? `${currentPath}/${item.folderName}` : item.folderName;
            closeFilesInFolder(item, newPath);
          }
        });
      };
      
      closeFilesInFolder(folder, parentPath ? `${parentPath}/${folder.folderName}` : folder.folderName);

      set({ templateData: updatedTemplateData });

      await saveTemplateData(updatedTemplateData);
      toast.success(`Deleted folder: ${folder.folderName}`);
    } catch (error) {
      log.error("Error deleting folder", { error });
      toast.error("Failed to delete folder");
    }
  },

  handleRenameFile: async (
    file,
    newFilename,
    newExtension,
    parentPath
  ) => {
    const { templateData, openFiles, activeFileId, saveTemplateData } = get();
    if (!templateData || !saveTemplateData) return;

    // Generate old and new file IDs using the same logic as openFile
    const oldFileId = generateFileId(file, templateData);
    const newFile = { ...file, filename: newFilename, fileExtension: newExtension };
    const newFileId = generateFileId(newFile, templateData);

    try {
      const updatedTemplateData = JSON.parse(
        JSON.stringify(templateData)
      ) as TemplateFolder;
      const pathParts = parentPath.split("/");
      let currentFolder = updatedTemplateData;

      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            (item) => "folderName" in item && item.folderName === part
          ) as TemplateFolder;
          if (nextFolder) currentFolder = nextFolder;
        }
      }

      const fileIndex = currentFolder.items.findIndex(
        (item) =>
          "filename" in item &&
          item.filename === file.filename &&
          item.fileExtension === file.fileExtension
      );

      if (fileIndex !== -1) {
        const updatedFile = {
          ...currentFolder.items[fileIndex],
          filename: newFilename,
          fileExtension: newExtension,
        } as TemplateFile;
        currentFolder.items[fileIndex] = updatedFile;

        // Update open files with new ID and names
        const updatedOpenFiles = openFiles.map((f) =>
          f.id === oldFileId
            ? {
                ...f,
                id: newFileId,
                filename: newFilename,
                fileExtension: newExtension,
              }
            : f
        );

        set({
          templateData: updatedTemplateData,
          openFiles: updatedOpenFiles,
          activeFileId: activeFileId === oldFileId ? newFileId : activeFileId,
        });

        await saveTemplateData(updatedTemplateData);
        toast.success(`Renamed file to: ${newFilename}.${newExtension}`);
      }
    } catch (error) {
      log.error("Error renaming file", { error });
      toast.error("Failed to rename file");
    }
  },

  handleRenameFolder: async (folder, newFolderName, parentPath) => {
    const { templateData, saveTemplateData } = get();
    if (!templateData || !saveTemplateData) return;

    try {
      const updatedTemplateData = JSON.parse(
        JSON.stringify(templateData)
      ) as TemplateFolder;
      const pathParts = parentPath.split("/");
      let currentFolder = updatedTemplateData;

      for (const part of pathParts) {
        if (part) {
          const nextFolder = currentFolder.items.find(
            (item) => "folderName" in item && item.folderName === part
          ) as TemplateFolder;
          if (nextFolder) currentFolder = nextFolder;
        }
      }

      const folderIndex = currentFolder.items.findIndex(
        (item) => "folderName" in item && item.folderName === folder.folderName
      );

      if (folderIndex !== -1) {
        const updatedFolder = {
          ...currentFolder.items[folderIndex],
          folderName: newFolderName,
        } as TemplateFolder;
        currentFolder.items[folderIndex] = updatedFolder;

        set({ templateData: updatedTemplateData });

        await saveTemplateData(updatedTemplateData);
        toast.success(`Renamed folder to: ${newFolderName}`);
      }
    } catch (error) {
      log.error("Error renaming folder", { error });
      toast.error("Failed to rename folder");
    }
  },

  updateFileContent: (fileId, content) => {
    set((state) => ({
      openFiles: state.openFiles.map((file) =>
        file.id === fileId
          ? {
              ...file,
              content,
              hasUnsavedChanges: content !== file.originalContent,
            }
          : file
      ),
      editorContent:
        fileId === state.activeFileId ? content : state.editorContent,
    }));
  },
}));
