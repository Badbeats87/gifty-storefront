import 'server-only';

/**
 * Simple in-memory rate limiter for login attempts
 * For production, consider using Redis or similar
 */

interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

// In-memory store for rate limiting
// Key format: "ip:{ip}" or "email:{email}"
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  // Max attempts per window
  maxAttempts: 5,
  // Window duration in milliseconds (15 minutes)
  windowMs: 15 * 60 * 1000,
  // Cleanup interval (run every 5 minutes)
  cleanupIntervalMs: 5 * 60 * 1000,
};

// Cleanup old entries periodically
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, RATE_LIMIT_CONFIG.cleanupIntervalMs);

  // Prevent cleanup from keeping the process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

// Start cleanup when module loads
startCleanup();

/**
 * Check if a request is rate limited
 * @param identifier Unique identifier (IP address or email)
 * @param type Type of identifier ('ip' or 'email')
 * @returns Object with isLimited flag and remaining attempts
 */
export function checkRateLimit(
  identifier: string,
  type: 'ip' | 'email' = 'ip'
): {
  isLimited: boolean;
  remainingAttempts: number;
  resetAt: Date;
  retryAfterSeconds: number;
} {
  const key = `${type}:${identifier.toLowerCase()}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No entry or entry expired - allow request
  if (!entry || entry.resetAt < now) {
    return {
      isLimited: false,
      remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - 1,
      resetAt: new Date(now + RATE_LIMIT_CONFIG.windowMs),
      retryAfterSeconds: 0,
    };
  }

  // Check if limit exceeded
  const isLimited = entry.attempts >= RATE_LIMIT_CONFIG.maxAttempts;
  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

  return {
    isLimited,
    remainingAttempts: Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - entry.attempts - 1),
    resetAt: new Date(entry.resetAt),
    retryAfterSeconds: isLimited ? retryAfterSeconds : 0,
  };
}

/**
 * Record a login attempt
 * @param identifier Unique identifier (IP address or email)
 * @param type Type of identifier ('ip' or 'email')
 */
export function recordAttempt(identifier: string, type: 'ip' | 'email' = 'ip'): void {
  const key = `${type}:${identifier.toLowerCase()}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    rateLimitStore.set(key, {
      attempts: 1,
      resetAt: now + RATE_LIMIT_CONFIG.windowMs,
    });
  } else {
    // Increment existing entry
    entry.attempts += 1;
    rateLimitStore.set(key, entry);
  }
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 * @param identifier Unique identifier (IP address or email)
 * @param type Type of identifier ('ip' or 'email')
 */
export function resetRateLimit(identifier: string, type: 'ip' | 'email' = 'ip'): void {
  const key = `${type}:${identifier.toLowerCase()}`;
  rateLimitStore.delete(key);
}

/**
 * Get client IP address from request
 * @param request Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
  // Try various headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Rate limit middleware for API routes
 * @param request Next.js request object
 * @param identifier Optional identifier (defaults to IP address)
 * @returns Rate limit result or null if not limited
 */
export async function rateLimitMiddleware(
  request: Request,
  identifier?: string
): Promise<{
  limited: boolean;
  response?: Response;
}> {
  const ip = getClientIp(request);
  const checkId = identifier || ip;

  // Check both IP and identifier (if provided)
  const ipLimit = checkRateLimit(ip, 'ip');
  const identifierLimit = identifier
    ? checkRateLimit(identifier, 'email')
    : { isLimited: false, remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts, resetAt: new Date(), retryAfterSeconds: 0 };

  if (ipLimit.isLimited || identifierLimit.isLimited) {
    const activeLimit = ipLimit.isLimited ? ipLimit : identifierLimit;

    return {
      limited: true,
      response: Response.json(
        {
          error: 'Too many login attempts',
          message: `Too many login attempts. Please try again in ${activeLimit.retryAfterSeconds} seconds.`,
          retryAfter: activeLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': activeLimit.retryAfterSeconds.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxAttempts.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': activeLimit.resetAt.toISOString(),
          },
        }
      ),
    };
  }

  return { limited: false };
}

/**
 * Clear all rate limit entries (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get rate limit stats (for debugging)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  entries: Array<{ key: string; attempts: number; resetAt: Date }>;
} {
  const entries = Array.from(rateLimitStore.entries()).map(([key, entry]) => ({
    key,
    attempts: entry.attempts,
    resetAt: new Date(entry.resetAt),
  }));

  return {
    totalEntries: rateLimitStore.size,
    entries,
  };
}
