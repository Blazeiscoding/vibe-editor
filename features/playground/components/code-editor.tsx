"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { EditorSkeleton } from "@/components/loading/editor-skeleton"

// Lazy load Monaco for better performance
let monaco: any = null
let loader: any = null

const loadMonaco = async () => {
  if (!monaco) {
    const monacoModule = await import("monaco-editor")
    const loaderModule = await import("@monaco-editor/react")
    monaco = monacoModule.default
    loader = loaderModule.loader
    loader.config({ monaco })
  }
  return monaco
}

interface MonacoEditorProps {
  content: string
  language: string
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
}

export function MonacoEditor({ content, language, onChange, readOnly = false, className }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return

    let isMounted = true

    const initEditor = async () => {
      try {
        const monacoInstance = await loadMonaco()
        
        if (!isMounted || !editorRef.current) return

        const newEditor = monacoInstance.editor.create(editorRef.current, {
          value: content,
          language: getLanguageFromExtension(language),
          theme: "vs-dark",
          automaticLayout: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          readOnly,
          fontSize: 14,
          lineNumbers: "on",
          wordWrap: "on",
          renderLineHighlight: "all",
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        })

        setEditor(newEditor)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load Monaco editor:", error)
        setIsLoading(false)
      }
    }

    initEditor()

    return () => {
      isMounted = false
      if (editor) {
        editor.dispose()
      }
    }
  }, [content, language, readOnly])

  // Update content when it changes
  useEffect(() => {
    if (editor && content !== editor.getValue()) {
      editor.setValue(content)
    }
  }, [content, editor])

  // Update language when it changes
  useEffect(() => {
    if (editor) {
      monaco.editor.setModelLanguage(editor.getModel()!, getLanguageFromExtension(language))
    }
  }, [language, editor])

  // Handle content changes
  useEffect(() => {
    if (editor && onChange) {
      const disposable = editor.onDidChangeModelContent(() => {
        onChange(editor.getValue())
      })

      return () => {
        disposable.dispose()
      }
    }
  }, [editor, onChange])

  if (isLoading) {
    return <EditorSkeleton />
  }

  return (
    <div ref={editorRef} className={cn("h-full w-full border border-border rounded-md overflow-hidden", className)} />
  )
}

// Helper function to determine Monaco language from file extension
function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    py: "python",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    sh: "shell",
    sql: "sql",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
  }

  return languageMap[extension.toLowerCase()] || "plaintext"
}
