import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This resets on server restart. For production at scale,
// consider using Redis or similar persistent store.
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header (common for proxies like Vercel) or falls back to IP
 */
function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in the chain (client IP)
    return forwardedFor.split(",")[0].trim();
  }
  
  // Fallback to a hash of user-agent + accept-language for identification
  const userAgent = request.headers.get("user-agent") || "unknown";
  const acceptLanguage = request.headers.get("accept-language") || "unknown";
  return `${userAgent}-${acceptLanguage}`.substring(0, 100);
}

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  // Default: 60 requests per minute
  default: { maxRequests: 60, windowMs: 60 * 1000 },
  // Strict: 30 requests per minute (for sensitive operations)
  strict: { maxRequests: 30, windowMs: 60 * 1000 },
  // Relaxed: 120 requests per minute
  relaxed: { maxRequests: 120, windowMs: 60 * 1000 },
  // Auth endpoints: 10 requests per minute
  auth: { maxRequests: 10, windowMs: 60 * 1000 },
} as const;

/**
 * Check rate limit for a request
 * @returns Object with allowed status and rate limit info
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitPresets.default,
  identifier?: string
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  cleanupExpiredEntries();
  
  const clientId = identifier || getClientIdentifier(request);
  const key = `${request.nextUrl.pathname}:${clientId}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
      limit: config.maxRequests,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  const allowed = entry.count <= config.maxRequests;
  
  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
    limit: config.maxRequests,
  };
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  info: { remaining: number; resetTime: number; limit: number }
): NextResponse {
  response.headers.set("X-RateLimit-Limit", info.limit.toString());
  response.headers.set("X-RateLimit-Remaining", info.remaining.toString());
  response.headers.set("X-RateLimit-Reset", info.resetTime.toString());
  return response;
}

/**
 * Create a rate-limited response (429 Too Many Requests)
 */
export function createRateLimitResponse(
  info: { remaining: number; resetTime: number; limit: number }
): NextResponse {
  const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000);
  
  const response = NextResponse.json(
    {
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter,
    },
    { status: 429 }
  );
  
  response.headers.set("Retry-After", retryAfter.toString());
  applyRateLimitHeaders(response, info);
  
  return response;
}

/**
 * Higher-order function to wrap an API route handler with rate limiting
 * @example
 * export const GET = withRateLimit(async (request) => {
 *   // Your handler logic
 *   return NextResponse.json({ data: 'success' });
 * });
 */
export function withRateLimit<T extends NextRequest>(
  handler: (request: T, ...args: unknown[]) => Promise<NextResponse>,
  config: RateLimitConfig = rateLimitPresets.default
) {
  return async (request: T, ...args: unknown[]): Promise<NextResponse> => {
    const rateLimitInfo = checkRateLimit(request, config);
    
    if (!rateLimitInfo.allowed) {
      return createRateLimitResponse(rateLimitInfo);
    }
    
    const response = await handler(request, ...args);
    return applyRateLimitHeaders(response, rateLimitInfo);
  };
}

/**
 * Simple rate limit check that can be used inline in route handlers
 * @example
 * export async function GET(request: NextRequest) {
 *   const rateLimitResult = rateLimit(request, rateLimitPresets.strict);
 *   if (!rateLimitResult.allowed) {
 *     return rateLimitResult.response;
 *   }
 *   // Continue with handler logic
 * }
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitPresets.default
): { allowed: true; headers: Record<string, string> } | { allowed: false; response: NextResponse } {
  const info = checkRateLimit(request, config);
  
  if (!info.allowed) {
    return { allowed: false, response: createRateLimitResponse(info) };
  }
  
  return {
    allowed: true,
    headers: {
      "X-RateLimit-Limit": info.limit.toString(),
      "X-RateLimit-Remaining": info.remaining.toString(),
      "X-RateLimit-Reset": info.resetTime.toString(),
    },
  };
}
