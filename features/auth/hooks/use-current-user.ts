"use client";

import { authClient } from "@/lib/auth-client";

export const useCurrentUser = () => {
    const { data: session } = authClient.useSession();

    return session?.user;
};