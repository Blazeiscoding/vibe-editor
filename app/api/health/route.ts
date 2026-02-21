import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // Ping MongoDB via Prisma's raw command
    await db.$runCommandRaw({ ping: 1 });

    return NextResponse.json(
      {
        status: "ok",
        db: "connected",
        timestamp,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        error: message,
        timestamp,
      },
      { status: 503 }
    );
  }
}
