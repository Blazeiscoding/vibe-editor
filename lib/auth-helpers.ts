/**
 * Authorization helper functions
 */

import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db";

/**
 * Verifies that the current user owns the playground
 * @param playgroundId - The ID of the playground to check
 * @returns The playground if user owns it, null otherwise
 * @throws Error if user is not authenticated or playground not found
 */
export async function verifyPlaygroundOwnership(playgroundId: string) {
  const user = await currentUser();
  
  if (!user?.id) {
    throw new Error("Unauthorized: User must be authenticated");
  }

  const playground = await db.playground.findUnique({
    where: { id: playgroundId },
    select: { userId: true },
  });

  if (!playground) {
    throw new Error("Playground not found");
  }

  if (playground.userId !== user.id) {
    throw new Error("Forbidden: You don't have permission to access this playground");
  }

  return { userId: user.id, playground };
}

/**
 * Verifies that the current user is authenticated
 * @returns User with guaranteed id property
 * @throws Error if user is not authenticated
 */
export async function requireAuth() {
  const user = await currentUser();
  
  if (!user?.id) {
    throw new Error("Unauthorized: User must be authenticated");
  }

  // Type assertion: after the check above, we know user.id exists
  return user as { id: string; email: string; name?: string | null; image?: string | null; role?: string };
}

