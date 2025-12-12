"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

export type InputDialogMode = "new-file" | "new-folder" | "rename-file" | "rename-folder";

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: InputDialogMode;
  // For rename modes
  currentFilename?: string;
  currentExtension?: string;
  currentFolderName?: string;
  // Callbacks
  onCreateFile?: (filename: string, extension: string) => void;
  onCreateFolder?: (folderName: string) => void;
  onRenameFile?: (filename: string, extension: string) => void;
  onRenameFolder?: (folderName: string) => void;
}

const CONFIG: Record<InputDialogMode, { title: string; description: string; submitLabel: string }> = {
  "new-file": {
    title: "Create New File",
    description: "Enter a name for the new file and select its extension.",
    submitLabel: "Create",
  },
  "new-folder": {
    title: "Create New Folder",
    description: "Enter a name for the new folder.",
    submitLabel: "Create",
  },
  "rename-file": {
    title: "Rename File",
    description: "Enter a new name for the file.",
    submitLabel: "Rename",
  },
  "rename-folder": {
    title: "Rename Folder",
    description: "Enter a new name for the folder.",
    submitLabel: "Rename",
  },
};

export function InputDialog({
  isOpen,
  onClose,
  mode,
  currentFilename = "",
  currentExtension = "js",
  currentFolderName = "",
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onRenameFolder,
}: InputDialogProps) {
  const [filename, setFilename] = React.useState("");
  const [extension, setExtension] = React.useState("js");
  const [folderName, setFolderName] = React.useState("");

  const isFileMode = mode === "new-file" || mode === "rename-file";
  const isFolderMode = mode === "new-folder" || mode === "rename-folder";
  const config = CONFIG[mode];

  // Reset/initialize values when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      if (mode === "rename-file") {
        setFilename(currentFilename);
        setExtension(currentExtension);
      } else if (mode === "rename-folder") {
        setFolderName(currentFolderName);
      } else if (mode === "new-file") {
        setFilename("");
        setExtension("js");
      } else {
        setFolderName("");
      }
    }
  }, [isOpen, mode, currentFilename, currentExtension, currentFolderName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    switch (mode) {
      case "new-file":
        if (filename.trim() && onCreateFile) {
          onCreateFile(filename.trim(), extension.trim() || "js");
        }
        break;
      case "new-folder":
        if (folderName.trim() && onCreateFolder) {
          onCreateFolder(folderName.trim());
        }
        break;
      case "rename-file":
        if (filename.trim() && onRenameFile) {
          onRenameFile(filename.trim(), extension.trim() || currentExtension);
        }
        break;
      case "rename-folder":
        if (folderName.trim() && onRenameFolder) {
          onRenameFolder(folderName.trim());
        }
        break;
    }
    
    onClose();
  };

  const isValid = isFileMode ? filename.trim() : folderName.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {isFileMode && (
              <>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="filename" className="text-right">
                    Filename
                  </Label>
                  <Input
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="col-span-2"
                    autoFocus
                    placeholder="main"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="extension" className="text-right">
                    Extension
                  </Label>
                  <Input
                    id="extension"
                    value={extension}
                    onChange={(e) => setExtension(e.target.value)}
                    className="col-span-2"
                    placeholder="js"
                  />
                </div>
              </>
            )}
            {isFolderMode && (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="foldername" className="text-right">
                  Folder Name
                </Label>
                <Input
                  id="foldername"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="col-span-2"
                  autoFocus
                  placeholder="components"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              {config.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default InputDialog;
