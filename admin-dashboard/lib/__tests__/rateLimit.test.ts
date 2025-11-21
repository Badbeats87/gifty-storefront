import {
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitStats,
} from '../rateLimit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('192.168.1.1', 'ip');

      expect(result.isLimited).toBe(false);
      expect(result.remainingAttempts).toBe(4); // 5 max - 1 for first check
    });

    it('should track remaining attempts', () => {
      const ip = '192.168.1.1';

      // First attempt
      let result = checkRateLimit(ip, 'ip');
      expect(result.remainingAttempts).toBe(4);

      // Record attempts
      recordAttempt(ip, 'ip');
      recordAttempt(ip, 'ip');

      result = checkRateLimit(ip, 'ip');
      expect(result.remainingAttempts).toBe(2); // 5 max - 3 recorded
    });

    it('should limit after max attempts', () => {
      const ip = '192.168.1.1';

      // Record 5 attempts
      for (let i = 0; i < 5; i++) {
        recordAttempt(ip, 'ip');
      }

      const result = checkRateLimit(ip, 'ip');

      expect(result.isLimited).toBe(true);
      expect(result.remainingAttempts).toBe(0);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('should handle email-based rate limiting', () => {
      const email = 'test@example.com';

      recordAttempt(email, 'email');
      recordAttempt(email, 'email');

      const result = checkRateLimit(email, 'email');

      expect(result.isLimited).toBe(false);
      expect(result.remainingAttempts).toBe(2); // 5 max - 3 (2 recorded + 1 check)
    });

    it('should be case insensitive for emails', () => {
      recordAttempt('Test@Example.com', 'email');
      recordAttempt('test@example.com', 'email');

      const result = checkRateLimit('TEST@EXAMPLE.COM', 'email');

      expect(result.remainingAttempts).toBe(2); // Should count all as same
    });
  });

  describe('recordAttempt', () => {
    it('should record attempts correctly', () => {
      const ip = '192.168.1.1';

      recordAttempt(ip, 'ip');

      const result = checkRateLimit(ip, 'ip');
      expect(result.remainingAttempts).toBeLessThan(4);
    });

    it('should accumulate multiple attempts', () => {
      const ip = '192.168.1.1';

      recordAttempt(ip, 'ip');
      recordAttempt(ip, 'ip');
      recordAttempt(ip, 'ip');

      const result = checkRateLimit(ip, 'ip');
      expect(result.remainingAttempts).toBe(1); // 5 max - 4 (3 recorded + 1 check)
    });

    it('should track IP and email separately', () => {
      const identifier = '192.168.1.1';

      recordAttempt(identifier, 'ip');
      recordAttempt(identifier, 'ip');

      recordAttempt(identifier, 'email');

      const ipResult = checkRateLimit(identifier, 'ip');
      const emailResult = checkRateLimit(identifier, 'email');

      expect(ipResult.remainingAttempts).toBe(2); // 3 total for IP
      expect(emailResult.remainingAttempts).toBe(3); // 2 total for email
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for identifier', () => {
      const ip = '192.168.1.1';

      // Record attempts
      for (let i = 0; i < 3; i++) {
        recordAttempt(ip, 'ip');
      }

      // Reset
      resetRateLimit(ip, 'ip');

      // Check - should be back to initial state
      const result = checkRateLimit(ip, 'ip');
      expect(result.remainingAttempts).toBe(4);
    });

    it('should not affect other identifiers', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      recordAttempt(ip1, 'ip');
      recordAttempt(ip2, 'ip');

      resetRateLimit(ip1, 'ip');

      const result1 = checkRateLimit(ip1, 'ip');
      const result2 = checkRateLimit(ip2, 'ip');

      expect(result1.remainingAttempts).toBe(4); // Reset
      expect(result2.remainingAttempts).toBe(3); // Still tracked
    });
  });

  describe('clearAllRateLimits', () => {
    it('should clear all rate limits', () => {
      recordAttempt('192.168.1.1', 'ip');
      recordAttempt('192.168.1.2', 'ip');
      recordAttempt('test@example.com', 'email');

      let stats = getRateLimitStats();
      expect(stats.totalEntries).toBeGreaterThan(0);

      clearAllRateLimits();

      stats = getRateLimitStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('getRateLimitStats', () => {
    it('should return correct stats', () => {
      recordAttempt('192.168.1.1', 'ip');
      recordAttempt('test@example.com', 'email');

      const stats = getRateLimitStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toHaveProperty('key');
      expect(stats.entries[0]).toHaveProperty('attempts');
      expect(stats.entries[0]).toHaveProperty('resetAt');
    });

    it('should show correct attempt counts', () => {
      const ip = '192.168.1.1';

      recordAttempt(ip, 'ip');
      recordAttempt(ip, 'ip');
      recordAttempt(ip, 'ip');

      const stats = getRateLimitStats();
      const entry = stats.entries.find((e) => e.key === `ip:${ip}`);

      expect(entry).toBeDefined();
      expect(entry?.attempts).toBe(3);
    });
  });

  describe('Rate Limit Window', () => {
    it('should provide reset timestamp', () => {
      const ip = '192.168.1.1';
      recordAttempt(ip, 'ip');

      const result = checkRateLimit(ip, 'ip');

      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should calculate retry after seconds when limited', () => {
      const ip = '192.168.1.1';

      // Hit the limit
      for (let i = 0; i < 5; i++) {
        recordAttempt(ip, 'ip');
      }

      const result = checkRateLimit(ip, 'ip');

      expect(result.isLimited).toBe(true);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(15 * 60); // Max 15 minutes
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty identifier gracefully', () => {
      const result = checkRateLimit('', 'ip');

      expect(result.isLimited).toBe(false);
      expect(result.remainingAttempts).toBeGreaterThanOrEqual(0);
    });

    it('should handle special characters in email', () => {
      const email = 'test+tag@example.com';

      recordAttempt(email, 'email');

      const result = checkRateLimit(email, 'email');

      expect(result.remainingAttempts).toBeLessThan(4);
    });

    it('should handle rapid sequential attempts', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 10; i++) {
        recordAttempt(ip, 'ip');
      }

      const result = checkRateLimit(ip, 'ip');

      expect(result.isLimited).toBe(true);
      expect(result.remainingAttempts).toBe(0);
    });
  });
});
