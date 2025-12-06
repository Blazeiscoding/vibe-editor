"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: { accounts: true },
    });
    return user;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getAccountByUserId = async (userId: string) => {
  try {
    const account = await db.account.findFirst({
      where: {
        userId,
      },
    });
    return account;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const currentUser = async () => {
  const session = await auth.api.getSession({
    headers: (await headers()) as unknown as Headers,
  });
  return session?.user;
};
