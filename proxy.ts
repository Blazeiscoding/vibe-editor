import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  publicRoutes,
  authRoutes,
} from "@/routes";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  
  try {
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });
    const isLoggedIn = !!session;

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);

    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

    const isAuthRoute = authRoutes.includes(nextUrl.pathname);

    if (isApiAuthRoute) {
      return NextResponse.next();
    }

    if (isAuthRoute) {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
      return NextResponse.next();
    }

    if (!isLoggedIn && !isPublicRoute) {
      return NextResponse.redirect(new URL("/auth/sign-in", nextUrl));
    }

    return NextResponse.next();
  } catch {
    // If auth check fails, allow public routes
    if (publicRoutes.includes(nextUrl.pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/auth/sign-in", nextUrl));
  }
}

export const config = {
  // copied from clerk
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
