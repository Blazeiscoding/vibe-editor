
"use server";
import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db";
import { TemplateFolder } from "../libs/path-to-json";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { verifyPlaygroundOwnership, requireAuth } from "@/lib/auth-helpers";
import type { Prisma } from "@prisma/client";

// Toggle marked status for a problem
export const toggleStarMarked = async (
  playgroundId: string,
  isChecked: boolean
) => {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    if (isChecked) {
      await db.starMark.create({
        data: {
          userId: userId,
          playgroundId,
          isMarked: isChecked,
        },
      });
    } else {
      await db.starMark.delete({
        where: {
          userId_playgroundId: {
            userId,
            playgroundId: playgroundId,
          },
        },
      });
    }

    revalidatePath("/dashboard");
    return { success: true, isMarked: isChecked };
  } catch (error) {
    logger.error("Error updating star mark", {
      playgroundId,
      isChecked,
      error,
    });
    return { success: false, error: "Failed to update star mark" };
  }
};

export const createPlayground = async (data: {
  title: string;
  template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
  description?: string;
}) => {
  const { template, title, description } = data;

  const user = await requireAuth();

  try {
    const playground = await db.playground.create({
      data: {
        title: title,
        description: description,
        template: template,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    return playground;
  } catch (error) {
    logger.error("Error creating playground", { data, error });
    throw new Error("Failed to create playground");
  }
};

export const getAllPlaygroundForUser = async () => {
  try {
    const user = await requireAuth();
    const playground = await db.playground.findMany({
      where: {
        userId: user.id,
      },
      include: {
        user: true,
        Starmark: {
          where: {
            userId: user.id,
          },
          select: {
            isMarked: true,
          },
        },
      },
    });

    return playground;
  } catch (error) {
    logger.error("Error fetching playgrounds for user", { error });
    return [];
  }
};

export const getPlaygroundById = async (id: string) => {
  try {
    const playground = await db.playground.findUnique({
      where: { id },
      select: {
        templateFiles: {
          select: {
            content: true,
          },
        },
      },
    });
    return playground;
  } catch (error) {
    logger.error("Error fetching playground by id", { id, error });
    return null;
  }
};

export const SaveUpdatedCode = async (
  playgroundId: string,
  data: TemplateFolder
) => {
  // Verify user owns the playground before allowing save
  await verifyPlaygroundOwnership(playgroundId);

  try {
    // Prisma Json type accepts any JSON-serializable value
    // Cast to Prisma.InputJsonValue which is the correct type for Prisma Json fields
    const jsonContent = data as unknown as Prisma.InputJsonValue;

    const updatedPlayground = await db.templateFile.upsert({
      where: {
        playgroundId, // now allowed since playgroundId is unique
      },
      update: {
        content: jsonContent,
      },
      create: {
        playgroundId,
        content: jsonContent,
      },
    });

    revalidatePath(`/playground/${playgroundId}`);
    return updatedPlayground;
  } catch (error) {
    logger.error("Error saving updated code", { playgroundId, error });
    throw error instanceof Error ? error : new Error("Failed to save code");
  }
};

export const deleteProjectById = async (id: string) => {
  // Verify user owns the playground before allowing delete
  await verifyPlaygroundOwnership(id);

  try {
    await db.playground.delete({
      where: { id },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    logger.error("Error deleting project", { id, error });
    throw error instanceof Error
      ? error
      : new Error("Failed to delete project");
  }
};

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
) => {
  // Verify user owns the playground before allowing edit
  await verifyPlaygroundOwnership(id);

  try {
    await db.playground.update({
      where: { id },
      data: data,
    });
    revalidatePath("/dashboard");
  } catch (error) {
    logger.error("Error editing project", { id, data, error });
    throw error instanceof Error ? error : new Error("Failed to edit project");
  }
};

export const duplicateProjectById = async (id: string) => {
  // Verify user owns the playground before allowing duplicate
  const { userId } = await verifyPlaygroundOwnership(id);

  try {
    // Fetch the original playground data
    const originalPlayground = await db.playground.findUnique({
      where: { id },
      include: {
        templateFiles: true, // Include related template files
      },
    });

    if (!originalPlayground) {
      throw new Error("Original playground not found");
    }

    // Create a new playground with the same data but a new ID
    // Properly type the templateFiles content
    const duplicatedPlayground = await db.playground.create({
      data: {
        title: `${originalPlayground.title} (Copy)`,
        description: originalPlayground.description,
        template: originalPlayground.template,
        userId: userId, // Use the verified userId
        templateFiles:
          originalPlayground.templateFiles.length > 0
            ? {
                create: originalPlayground.templateFiles.map((file) => ({
                  content: file.content as Prisma.InputJsonValue, // Prisma Json type
                })),
              }
            : undefined,
      },
    });

    // Revalidate the dashboard path to reflect the changes
    revalidatePath("/dashboard");

    return duplicatedPlayground;
  } catch (error) {
    logger.error("Error duplicating project", { id, error });
    throw error instanceof Error
      ? error
      : new Error("Failed to duplicate project");
  }
};
