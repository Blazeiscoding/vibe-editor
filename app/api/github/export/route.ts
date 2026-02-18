import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import {
  getGitHubToken,
  createRepository,
  pushFilesToRepo,
  flattenTemplateToFiles,
  parseRepo,
} from "@/lib/github";
import { z } from "zod";
import { validateRequestBody } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import type { TemplateFolder } from "@/features/playground/types";

// Schema for export request
const exportSchema = z
  .object({
    playgroundId: z.string().min(1, "Playground ID is required"),
    // For new repository
    repoName: z.string().optional(),
    description: z.string().optional(),
    isPrivate: z.boolean().optional(),
    // For existing repository
    existingRepo: z.string().optional(),
    // Common options
    branch: z.string().default("main"),
    commitMessage: z.string().default("Export from Vibe Editor"),
  })
  .refine((data) => data.repoName || data.existingRepo, {
    message: "Either repoName or existingRepo is required",
  });

/**
 * POST /api/github/export - Export playground to GitHub
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = rateLimit(request, rateLimitPresets.strict);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const session = await auth.api.getSession({
      headers: (await headers()) as unknown as Headers,
    });

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check GitHub connection
    const token = await getGitHubToken(session.user.id);
    if (!token) {
      return Response.json({ error: "GitHub not linked" }, { status: 400 });
    }

    // Validate request
    const validation = await validateRequestBody(request, exportSchema);
    if (!validation.success) {
      return validation.response;
    }

    const {
      playgroundId,
      repoName,
      description,
      isPrivate,
      existingRepo,
      branch,
      commitMessage,
    } = validation.data;

    // Get playground data
    const playground = await db.playground.findUnique({
      where: { id: playgroundId, userId: session.user.id },
      include: { templateFiles: true },
    });

    if (!playground) {
      return Response.json({ error: "Playground not found" }, { status: 404 });
    }

    // Parse template files
    const templateContent = playground.templateFiles[0]?.content;
    if (!templateContent) {
      return Response.json(
        { error: "No template files found" },
        { status: 400 }
      );
    }

    let templateData: TemplateFolder;
    if (typeof templateContent === "string") {
      templateData = JSON.parse(templateContent);
    } else {
      templateData = templateContent as unknown as TemplateFolder;
    }

    // Flatten template to files
    const files = flattenTemplateToFiles(templateData);

    if (files.length === 0) {
      return Response.json({ error: "No files to export" }, { status: 400 });
    }

    let owner: string;
    let repo: string;
    let repoUrl: string;

    if (repoName) {
      // Create new repository
      const newRepo = await createRepository(token, {
        name: repoName,
        description: description || `Exported from Vibe Editor: ${playground.title}`,
        isPrivate: isPrivate || false,
      });

      const parsed = parseRepo(newRepo.full_name);
      if (!parsed) {
        throw new Error("Failed to parse repository name");
      }

      owner = parsed.owner;
      repo = parsed.repo;
      repoUrl = newRepo.html_url;
    } else if (existingRepo) {
      // Use existing repository
      const parsed = parseRepo(existingRepo);
      if (!parsed) {
        return Response.json(
          { error: "Invalid repository format" },
          { status: 400 }
        );
      }

      owner = parsed.owner;
      repo = parsed.repo;
      repoUrl = `https://github.com/${owner}/${repo}`;
    } else {
      return Response.json(
        { error: "No repository specified" },
        { status: 400 }
      );
    }

    // Push files to repository
    const result = await pushFilesToRepo(
      token,
      owner,
      repo,
      branch,
      files,
      commitMessage
    );

    return Response.json({
      success: true,
      repoUrl,
      commitUrl: result.url,
      branch,
      filesCount: files.length,
    });
  } catch (error) {
    console.error("GitHub export failed:", error);
    const message =
      error instanceof Error ? error.message : "Export failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
