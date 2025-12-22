import { z } from "zod";

// ============================================
// Project Schemas
// ============================================

/**
 * Schema for updating a project (PUT /api/dashboard/projects/[id])
 */
export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional()
    .nullable(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * Template enum values
 */
export const templateValues = [
  "REACT",
  "NEXTJS",
  "EXPRESS",
  "VUE",
  "HONO",
  "ANGULAR",
] as const;

export type TemplateType = (typeof templateValues)[number];

/**
 * Schema for creating a new playground
 */
export const createPlaygroundSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less")
    .trim(),
  template: z.enum(templateValues, {
    message: "Invalid template. Must be one of: REACT, NEXTJS, EXPRESS, VUE, HONO, ANGULAR",
  }),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional(),
});

export type CreatePlaygroundInput = z.infer<typeof createPlaygroundSchema>;

/**
 * Schema for route ID parameter validation
 */
export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type IdParam = z.infer<typeof idParamSchema>;

// ============================================
// GitHub Schemas
// ============================================

/**
 * Schema for GitHub repository import
 * Either full_name OR repoUrl is required
 */
export const githubImportSchema = z
  .object({
    full_name: z.string().optional(),
    repoUrl: z.string().optional(),
  })
  .refine((data) => data.full_name || data.repoUrl, {
    message: "Either full_name or repoUrl is required",
  });

export type GitHubImportInput = z.infer<typeof githubImportSchema>;

/**
 * Schema for GitHub repository response item
 */
export const githubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  private: z.boolean(),
  description: z.string().nullable(),
  owner: z.string().optional(),
  default_branch: z.string().optional(),
});

export type GitHubRepo = z.infer<typeof githubRepoSchema>;

// ============================================
// API Response Schemas
// ============================================

/**
 * Standard API success response
 */
export const apiSuccessSchema = z.object({
  success: z.literal(true),
});

/**
 * Standard API error response
 */
export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.array(z.string()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Helper to create validation error response
 */
export function createValidationErrorResponse(error: z.ZodError) {
  // Zod v4 uses 'issues' instead of 'errors'
  const details = error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );
  return Response.json(
    {
      error: "Validation failed",
      details,
    } satisfies ApiError,
    { status: 400 }
  );
}

/**
 * Helper to validate request body with a schema
 */
export async function validateRequestBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: Response }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        response: createValidationErrorResponse(result.error),
      };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: Response.json(
        { error: "Invalid JSON body" } satisfies ApiError,
        { status: 400 }
      ),
    };
  }
}

/**
 * Helper to validate route params
 */
export function validateParams<T extends z.ZodSchema>(
  params: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: Response } {
  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      response: createValidationErrorResponse(result.error),
    };
  }

  return { success: true, data: result.data };
}
