import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import {
  updateProjectSchema,
  idParamSchema,
  validateRequestBody,
  validateParams,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting (strict for mutations)
  const rateLimitResult = rateLimit(request, rateLimitPresets.strict);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate route params
    const resolvedParams = await params;
    const paramsValidation = validateParams(resolvedParams, idParamSchema);
    if (!paramsValidation.success) {
      return paramsValidation.response;
    }
    const { id } = paramsValidation.data;

    // Validate request body
    const bodyValidation = await validateRequestBody(request, updateProjectSchema);
    if (!bodyValidation.success) {
      return bodyValidation.response;
    }
    const { title, description } = bodyValidation.data;

    // Update the project
    await db.playground.update({
      where: { id, userId: session.user.id },
      data: { title, description: description ?? null },
    });

    revalidatePath("/dashboard");
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to update project:", error);
    return Response.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting (strict for mutations)
  const rateLimitResult = rateLimit(request, rateLimitPresets.strict);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate route params
    const resolvedParams = await params;
    const paramsValidation = validateParams(resolvedParams, idParamSchema);
    if (!paramsValidation.success) {
      return paramsValidation.response;
    }
    const { id } = paramsValidation.data;

    // Delete the project
    await db.playground.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/dashboard");
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return Response.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
