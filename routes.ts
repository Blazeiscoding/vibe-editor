/**
 * An Array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */

export const publicRoutes: string[] = [];

/**
 * An Array of routes that are protected
 * These routes require authentication
 * @type {string[]}
 */

export const protectedRoutes: string[] = ["/"];

/**
 * An Array of routes used for authentication
 * These routes handle sign-in, sign-up, and related auth flows
 * @type {string[]}
 */

export const authRoutes: string[] = [
  "/auth/sign-in", // Added leading slash
];

/**
 * The prefix for authentication API routes
 * Routes that start with this prefix are handled by the auth provider
 * @type {string}
 */

export const apiAuthPrefix: string = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/"; // Changed to redirect to home page after login
