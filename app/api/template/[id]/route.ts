import {
  readTemplateStructureFromJson,
  saveTemplateStructureToJson,
} from "@/features/playground/libs/path-to-json";
import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";
import { idParamSchema, validateParams } from "@/lib/validations";
import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";
import { createLogger } from "@/lib/logger";

const logger = createLogger("Template");

// Helper function to ensure valid JSON
function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data)); // Ensures it's serializable
    return true;
  } catch (error) {
    logger.error("Invalid JSON structure", { error });
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate route params
    const resolvedParams = await params;
    const paramsValidation = validateParams(resolvedParams, idParamSchema);
    if (!paramsValidation.success) {
      return paramsValidation.response;
    }
    const { id } = paramsValidation.data;

    // Find playground in database
    const playground = await db.playground.findUnique({
      where: { id },
    });

    if (!playground) {
      return Response.json({ error: "Playground not found" }, { status: 404 });
    }

    // Get template path
    const templateKey = playground.template as keyof typeof templatePaths;
    const templatePath = templatePaths[templateKey];

    if (!templatePath) {
      return Response.json({ error: "Invalid template" }, { status: 404 });
    }

    // Generate template structure
    const inputPath = path.join(process.cwd(), templatePath);
    const outputFile = path.join(process.cwd(), `output/${templateKey}.json`);

    logger.debug("Generating template structure", { inputPath, outputFile });

    // Save and read the template structure
    await saveTemplateStructureToJson(inputPath, outputFile);
    const result = await readTemplateStructureFromJson(outputFile);

    // Validate the JSON structure before saving
    if (!validateJsonStructure(result.items)) {
      return Response.json(
        { error: "Invalid JSON structure" },
        { status: 500 }
      );
    }

    // Cleanup temp file
    await fs.unlink(outputFile);

    return Response.json(
      { success: true, templateJson: result },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error generating template JSON", { error });
    return Response.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
