/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const original = await db.playground.findUnique({
      where: { id, userId: session.user.id },
      include: { templateFiles: true },
    });
    if (!original) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

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
  } catch (e) {
    return Response.json({ error: "Failed to duplicate" }, { status: 500 });
  }
}
