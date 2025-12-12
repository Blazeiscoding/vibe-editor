/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

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
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id } = await params;
    const { title, description } = body as {
      title?: string;
      description?: string;
    };

    if (!title || typeof title !== "string") {
      return Response.json({ error: "Invalid title" }, { status: 400 });
    }

    await db.playground.update({
      where: { id, userId: session.user.id },
      data: { title, description: description ?? null },
    });

    revalidatePath("/dashboard");
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Failed to update" }, { status: 500 });
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
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.playground.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/dashboard");
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
