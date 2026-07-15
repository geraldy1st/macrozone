import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const RATE_LIMIT_PER_DAY = 20;

let rateLimiter: Ratelimit | null | undefined;

function getRateLimiter(): Ratelimit | null {
  if (rateLimiter !== undefined) {
    return rateLimiter;
  }

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    rateLimiter = null;
    return null;
  }

  rateLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_PER_DAY, "1 d"),
    prefix: "macrozone-analyze",
  });

  return rateLimiter;
}

export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return "unknown";
}

export function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const allowedOrigins =
    process.env.ALLOWED_ORIGINS?.split(",").map((value) => value.trim()) ??
    [];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-API-Key, Authorization",
  );
}

export type RequestIdentity = {
  id: string;
  source: "user" | "api-key";
};

function getBearerToken(req: VercelRequest): string | null {
  const authorization = req.headers.authorization;

  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function getAuthenticatedUser(
  req: VercelRequest,
): Promise<{ id: string; email?: string } | null> {
  const token = getBearerToken(req);
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!token || !supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseServiceRoleKey,
    },
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as { id?: string; email?: string };

  if (!user.id) {
    return null;
  }

  return { id: user.id, email: user.email };
}

export async function resolveRequestIdentity(
  req: VercelRequest,
): Promise<RequestIdentity | null> {
  const user = await getAuthenticatedUser(req);

  if (user) {
    return { id: user.id, source: "user" };
  }

  if (process.env.SUPABASE_URL) {
    return null;
  }

  if (isValidApiKey(req)) {
    return { id: getClientIp(req), source: "api-key" };
  }

  return null;
}

export function isValidApiKey(req: VercelRequest): boolean {
  const expectedKey = process.env.MACROZONE_API_KEY;
  const providedKey = req.headers["x-api-key"];

  if (!expectedKey) {
    return false;
  }

  return (
    typeof providedKey === "string" &&
    providedKey.length > 0 &&
    providedKey === expectedKey
  );
}

export function getImageByteSize(base64: string): number {
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.byteLength(cleanBase64, "base64");
}

export function isValidImagePayload(base64: string): boolean {
  if (!base64 || typeof base64 !== "string") {
    return false;
  }

  return getImageByteSize(base64) <= MAX_IMAGE_BYTES;
}

export async function isRateLimited(
  identifier: string,
): Promise<{ limited: boolean; remaining: number }> {
  const limiter = getRateLimiter();

  if (!limiter) {
    return { limited: false, remaining: RATE_LIMIT_PER_DAY };
  }

  const result = await limiter.limit(identifier);

  return {
    limited: !result.success,
    remaining: result.remaining,
  };
}