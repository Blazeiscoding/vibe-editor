import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getPlaygroundById,
  SaveUpdatedCode,
} from "@/features/playground/actions";
import type {
  TemplateFolder,
  PlaygroundByIdResult,
} from "@/features/playground/types";
import { parseTemplateContent } from "@/features/playground/types";
import { loggers } from "@/lib/logger";

const log = loggers.dashboard;

interface UsePlaygroundReturn {
  playgroundData: PlaygroundByIdResult | null;
  templateData: TemplateFolder | null;
  isLoading: boolean;
  error: string | null;
  loadPlayground: () => Promise<void>;
  saveTemplateData: (data: TemplateFolder) => Promise<void>;
}

export const usePlayground = (id: string): UsePlaygroundReturn => {
  const [playgroundData, setPlaygroundData] =
    useState<PlaygroundByIdResult | null>(null);
  const [templateData, setTemplateData] = useState<TemplateFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayground = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await getPlaygroundById(id);

      if (!data) {
        setError("Playground not found");
        return;
      }

      setPlaygroundData(data as PlaygroundByIdResult);

      // Check if we have saved template content
      const rawContent = data.templateFiles?.[0]?.content;
      if (rawContent) {
        const parsedContent = parseTemplateContent(
          rawContent as TemplateFolder | string
        );
        if (parsedContent) {
          setTemplateData(parsedContent);
          toast.success("Playground loaded successfully");
          return;
        }
      }

      // Load template from API if not in saved content
      const res = await fetch(`/api/template/${id}`);
      if (!res.ok) throw new Error(`Failed to load template: ${res.status}`);

      const templateRes = await res.json();
      if (templateRes.templateJson && Array.isArray(templateRes.templateJson)) {
        setTemplateData({
          folderName: "Root",
          items: templateRes.templateJson,
        });
      } else {
        setTemplateData(
          templateRes.templateJson || {
            folderName: "Root",
            items: [],
          }
        );
      }

      toast.success("Template loaded successfully");
    } catch (err) {
      log.error("Error loading playground", { error: err });
      setError("Failed to load playground data");
      toast.error("Failed to load playground data");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const saveTemplateData = useCallback(
    async (data: TemplateFolder) => {
      try {
        await SaveUpdatedCode(id, data);
        setTemplateData(data);
        toast.success("Changes saved successfully");
      } catch (err) {
        log.error("Error saving template data", { error: err });
        toast.error("Failed to save changes");
        throw err;
      }
    },
    [id]
  );

  useEffect(() => {
    loadPlayground();
  }, [loadPlayground]);

  return {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  };
};
