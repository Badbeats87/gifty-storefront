import { randomBytes } from 'crypto';

/**
 * Generate a CSRF token
 * Should be called on page load and stored in a hidden form field
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token from request headers
 * In production, validate against session-stored token
 */
export function validateCsrfToken(token: string | null): boolean {
  // For development/MVP, verify token exists and is valid format
  if (!token) {
    return false;
  }

  // Token should be 64 characters (32 bytes hex)
  if (typeof token !== 'string' || token.length !== 64) {
    return false;
  }

  // Verify it's a valid hex string
  if (!/^[a-f0-9]+$/.test(token)) {
    return false;
  }

  return true;
}

/**
 * Extract CSRF token from request headers
 * Expected header: X-CSRF-Token
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  return request.headers.get('x-csrf-token');
}
