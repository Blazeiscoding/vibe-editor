import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { z } from "zod";
import { validateRequestBody } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

// Schema for updating settings
const updateSettingsSchema = z.object({
  editorFontSize: z.number().min(10).max(32).optional(),
  editorTabSize: z.number().min(1).max(8).optional(),
  editorTheme: z.string().optional(),
  autoSave: z.boolean().optional(),
  notifications: z.boolean().optional(),
  minimap: z.boolean().optional(),
  wordWrap: z.enum(["off", "on", "wordWrapColumn"]).optional(),
});

// Default settings
const defaultSettings = {
  editorFontSize: 14,
  editorTabSize: 2,
  editorTheme: "vs-dark",
  autoSave: true,
  notifications: true,
  minimap: true,
  wordWrap: "off",
};

/**
 * GET /api/settings - Get user's settings
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = rateLimit(request, rateLimitPresets.default);
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

    // Get settings or return defaults
    const settings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      return Response.json({ settings: defaultSettings });
    }

    return Response.json({
      settings: {
        editorFontSize: settings.editorFontSize,
        editorTabSize: settings.editorTabSize,
        editorTheme: settings.editorTheme,
        autoSave: settings.autoSave,
        notifications: settings.notifications,
        minimap: settings.minimap,
        wordWrap: settings.wordWrap,
      },
    });
  } catch (error) {
    console.error("Failed to get settings:", error);
    return Response.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

/**
 * PUT /api/settings - Update user's settings
 */
export async function PUT(request: NextRequest) {
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

    // Validate request body
    const validation = await validateRequestBody(request, updateSettingsSchema);
    if (!validation.success) {
      return validation.response;
    }

    // Upsert settings (create if doesn't exist, update if exists)
    const settings = await db.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...validation.data,
      },
      update: validation.data,
    });

    return Response.json({
      success: true,
      settings: {
        editorFontSize: settings.editorFontSize,
        editorTabSize: settings.editorTabSize,
        editorTheme: settings.editorTheme,
        autoSave: settings.autoSave,
        notifications: settings.notifications,
        minimap: settings.minimap,
        wordWrap: settings.wordWrap,
      },
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
