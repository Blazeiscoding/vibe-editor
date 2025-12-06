"use client";

import { useAuthClient } from "better-auth/react";

export const useCurrentUser = () => {
    const { data: session } = useAuthClient();

    return session?.user;
};