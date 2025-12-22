import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { idParamSchema, validateParams } from "@/lib/validations";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

export async function POST(
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

    // Find the original project
    const original = await db.playground.findUnique({
      where: { id, userId: session.user.id },
      include: { templateFiles: true },
    });

    if (!original) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Create duplicate
    await db.playground.create({
      data: {
        title: `${original.title} (Copy)`,
        description: original.description,
        template: original.template,
        userId: original.userId,
        templateFiles: {
          create: original.templateFiles.map((f) => ({
            content: (f.content ?? {}) as unknown as Prisma.InputJsonValue,
          })),
        },
      },
    });

    revalidatePath("/dashboard");
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to duplicate project:", error);
    return Response.json({ error: "Failed to duplicate project" }, { status: 500 });
  }
}
