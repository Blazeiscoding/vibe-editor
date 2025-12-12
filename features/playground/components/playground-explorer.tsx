"use client"

import * as React from "react"
import { ChevronRight, File, Folder, Plus, FilePlus, FolderPlus, MoreHorizontal, Trash2, Edit3 } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { InputDialog, InputDialogMode } from "./dialogs/input-dialog"
import { DeleteDialog } from "./dialogs/delete-dialog"
import { TemplateFile, TemplateFolder } from "../types"

// Union type for items in the file system
type TemplateItem = TemplateFile | TemplateFolder

interface TemplateFileTreeProps {
  data: TemplateItem
  onFileSelect?: (file: TemplateFile) => void
  selectedFile?: TemplateFile
  title?: string
  onAddFile?: (file: TemplateFile, parentPath: string) => void
  onAddFolder?: (folder: TemplateFolder, parentPath: string) => void
  onDeleteFile?: (file: TemplateFile, parentPath: string) => void
  onDeleteFolder?: (folder: TemplateFolder, parentPath: string) => void
  onRenameFile?: (file: TemplateFile, newFilename: string, newExtension: string, parentPath: string) => void
  onRenameFolder?: (folder: TemplateFolder, newFolderName: string, parentPath: string) => void
}

export function TemplateFileTree({
  data,
  onFileSelect,
  selectedFile,
  title = "Files Explorer",
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
}: TemplateFileTreeProps) {
  const isRootFolder = data && typeof data === "object" && "folderName" in data
  const [dialogMode, setDialogMode] = React.useState<InputDialogMode | null>(null)

  const handleAddRootFile = () => setDialogMode("new-file")
  const handleAddRootFolder = () => setDialogMode("new-folder")

  const handleCreateFile = (filename: string, extension: string) => {
    if (onAddFile && isRootFolder) {
      onAddFile({ filename, fileExtension: extension, content: "" }, "")
    }
  }

  const handleCreateFolder = (folderName: string) => {
    if (onAddFolder && isRootFolder) {
      onAddFolder({ folderName, items: [] }, "")
    }
  }

  return (
    <Sidebar className="glass border-r-0" collapsible="none">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{title}</SidebarGroupLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarGroupAction>
                <Plus className="h-4 w-4" />
              </SidebarGroupAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAddRootFile}>
                <FilePlus className="h-4 w-4 mr-2" />
                New File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddRootFolder}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SidebarGroupContent>
            <SidebarMenu>
              {isRootFolder ? (
                (data as TemplateFolder).items.map((child, index) => (
                  <TemplateNode
                    key={index}
                    item={child}
                    onFileSelect={onFileSelect}
                    selectedFile={selectedFile}
                    level={0}
                    path=""
                    onAddFile={onAddFile}
                    onAddFolder={onAddFolder}
                    onDeleteFile={onDeleteFile}
                    onDeleteFolder={onDeleteFolder}
                    onRenameFile={onRenameFile}
                    onRenameFolder={onRenameFolder}
                  />
                ))
              ) : (
                <TemplateNode
                  item={data}
                  onFileSelect={onFileSelect}
                  selectedFile={selectedFile}
                  level={0}
                  path=""
                  onAddFile={onAddFile}
                  onAddFolder={onAddFolder}
                  onDeleteFile={onDeleteFile}
                  onDeleteFolder={onDeleteFolder}
                  onRenameFile={onRenameFile}
                  onRenameFolder={onRenameFolder}
                />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />

      <InputDialog
        isOpen={dialogMode !== null}
        onClose={() => setDialogMode(null)}
        mode={dialogMode || "new-file"}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
      />
    </Sidebar>
  )
}

interface TemplateNodeProps {
  item: TemplateItem
  onFileSelect?: (file: TemplateFile) => void
  selectedFile?: TemplateFile
  level: number
  path?: string
  onAddFile?: (file: TemplateFile, parentPath: string) => void
  onAddFolder?: (folder: TemplateFolder, parentPath: string) => void
  onDeleteFile?: (file: TemplateFile, parentPath: string) => void
  onDeleteFolder?: (folder: TemplateFolder, parentPath: string) => void
  onRenameFile?: (file: TemplateFile, newFilename: string, newExtension: string, parentPath: string) => void
  onRenameFolder?: (folder: TemplateFolder, newFolderName: string, parentPath: string) => void
}

function TemplateNode({
  item,
  onFileSelect,
  selectedFile,
  level,
  path = "",
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
}: TemplateNodeProps) {
  const isValidItem = item && typeof item === "object"
  const isFolder = isValidItem && "folderName" in item
  const [dialogMode, setDialogMode] = React.useState<InputDialogMode | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(level < 2)

  if (!isValidItem) return null

  if (!isFolder) {
    const file = item as TemplateFile
    const fileName = `${file.filename}.${file.fileExtension}`

    const isSelected =
      selectedFile && selectedFile.filename === file.filename && selectedFile.fileExtension === file.fileExtension

    const handleRename = () => setDialogMode("rename-file")

    const handleDelete = () => setIsDeleteDialogOpen(true)

    const confirmDelete = () => {
      onDeleteFile?.(file, path)
      setIsDeleteDialogOpen(false)
    }

    const handleRenameSubmit = (newFilename: string, newExtension: string) => {
      onRenameFile?.(file, newFilename, newExtension, path)
    }

    return (
      <SidebarMenuItem>
        <div className="flex items-center group">
          <SidebarMenuButton isActive={isSelected} onClick={() => onFileSelect?.(file)} className="flex-1">
            <File className="h-4 w-4 mr-2 shrink-0" />
            <span>{fileName}</span>
          </SidebarMenuButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRename}>
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <InputDialog
          isOpen={dialogMode === "rename-file"}
          onClose={() => setDialogMode(null)}
          mode="rename-file"
          currentFilename={file.filename}
          currentExtension={file.fileExtension}
          onRenameFile={handleRenameSubmit}
        />

      <DeleteDialog
      isOpen={isDeleteDialogOpen}
      setIsOpen={setIsDeleteDialogOpen}
      onConfirm={confirmDelete}
      title="Delete File"
      description={`Are you sure you want to delete "${fileName}"? This action cannot be undone.`}
      itemName={fileName}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      />
      </SidebarMenuItem>
    )
  } else {
    const folder = item as TemplateFolder
    const folderName = folder.folderName
    const currentPath = path ? `${path}/${folderName}` : folderName

    const handleAddFile = () => setDialogMode("new-file")
    const handleAddFolder = () => setDialogMode("new-folder")
    const handleRename = () => setDialogMode("rename-folder")
    const handleDelete = () => setIsDeleteDialogOpen(true)

    const confirmDelete = () => {
      onDeleteFolder?.(folder, path)
      setIsDeleteDialogOpen(false)
    }

    const handleCreateFile = (filename: string, extension: string) => {
      if (onAddFile) {
        onAddFile({ filename, fileExtension: extension, content: "" }, currentPath)
      }
    }

    const handleCreateFolder = (name: string) => {
      if (onAddFolder) {
        onAddFolder({ folderName: name, items: [] }, currentPath)
      }
    }

    const handleRenameSubmit = (newFolderName: string) => {
      onRenameFolder?.(folder, newFolderName, path)
    }

    return (
      <SidebarMenuItem>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="group/collapsible [&[data-state=open]>div>button>svg:first-child]:rotate-90"
        >
          <div className="flex items-center group">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="flex-1">
                <ChevronRight className="transition-transform" />
                <Folder className="h-4 w-4 mr-2 shrink-0" />
                <span>{folderName}</span>
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddFile}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddFolder}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRename}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CollapsibleContent>
            <SidebarMenuSub>
              {folder.items.map((childItem, index) => (
                <TemplateNode
                  key={index}
                  item={childItem}
                  onFileSelect={onFileSelect}
                  selectedFile={selectedFile}
                  level={level + 1}
                  path={currentPath}
                  onAddFile={onAddFile}
                  onAddFolder={onAddFolder}
                  onDeleteFile={onDeleteFile}
                  onDeleteFolder={onDeleteFolder}
                  onRenameFile={onRenameFile}
                  onRenameFolder={onRenameFolder}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>

        <InputDialog
          isOpen={dialogMode !== null}
          onClose={() => setDialogMode(null)}
          mode={dialogMode || "new-file"}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameSubmit}
          currentFolderName={folderName}
        />

      <DeleteDialog
      isOpen={isDeleteDialogOpen}
      setIsOpen={setIsDeleteDialogOpen}
      onConfirm={confirmDelete}
      title="Delete Folder"
      description={`Are you sure you want to delete "${folderName}" and all its contents? This action cannot be undone.`}
      itemName={folderName}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      />
      </SidebarMenuItem>
    )
  }
}

