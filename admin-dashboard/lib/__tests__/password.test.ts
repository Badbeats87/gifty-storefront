import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateSecurePassword,
  isPasswordExpired,
} from '../password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'SecurePass123!@#';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
      expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix
    });

    it('should create different hashes for the same password', async () => {
      const password = 'SecurePass123!@#';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt salts should differ
    });

    it('should reject passwords shorter than 12 characters', async () => {
      const shortPassword = 'Short1!';
      await expect(hashPassword(shortPassword)).rejects.toThrow('at least 12 characters');
    });

    it('should reject passwords longer than 128 characters', async () => {
      const longPassword = 'a'.repeat(129) + 'A1!';
      await expect(hashPassword(longPassword)).rejects.toThrow('at most 128 characters');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePass123!@#';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePass123!@#';
      const wrongPassword = 'WrongPass123!@#';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'SecurePass123!@#';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('securepass123!@#', hash);

      expect(isValid).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const isValid = await verifyPassword('anypassword', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('SecurePass123!@#');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('securepass123!@#');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('SECUREPASS123!@#');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without numbers', () => {
      const result = validatePasswordStrength('SecurePassword!@#');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should validate password requirements', () => {
      // Test that at least the basic validation structure works
      const weakResult = validatePasswordStrength('weak');
      expect(weakResult.isValid).toBe(false);
      expect(weakResult.errors.length).toBeGreaterThan(0);

      // Test a strong password passes
      const strongResult = validatePasswordStrength('StrongPass123!@#');
      expect(strongResult.isValid).toBe(true);
      expect(strongResult.errors.length).toBe(0);
    });

    it('should reject password shorter than 12 characters', () => {
      const result = validatePasswordStrength('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('at least 12 characters');
    });

    it('should provide suggestions for weak passwords', () => {
      const result = validatePasswordStrength('password123!');

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some((s) => s.toLowerCase().includes('common'))).toBe(true);
    });

    it('should reject sequential numbers', () => {
      const result = validatePasswordStrength('123456789Abc!');

      expect(result.suggestions.some((s) => s.includes('sequential'))).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password of specified length', () => {
      const password = generateSecurePassword(16);

      expect(password.length).toBe(16);
    });

    it('should generate password with default length', () => {
      const password = generateSecurePassword();

      expect(password.length).toBe(16);
    });

    it('should generate password meeting all requirements', () => {
      const password = generateSecurePassword();
      const validation = validatePasswordStrength(password);

      expect(validation.isValid).toBe(true);
      expect(password).toMatch(/[A-Z]/); // Has uppercase
      expect(password).toMatch(/[a-z]/); // Has lowercase
      expect(password).toMatch(/[0-9]/); // Has number
      expect(password).toMatch(/[^A-Za-z0-9]/); // Has special char
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();

      expect(password1).not.toBe(password2);
    });

    it('should generate longer passwords', () => {
      const password = generateSecurePassword(24);

      expect(password.length).toBe(24);
      expect(validatePasswordStrength(password).isValid).toBe(true);
    });
  });

  describe('isPasswordExpired', () => {
    it('should not expire recent password', () => {
      const recentDate = new Date();
      const isExpired = isPasswordExpired(recentDate, 90);

      expect(isExpired).toBe(false);
    });

    it('should expire old password', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      const isExpired = isPasswordExpired(oldDate, 90);

      expect(isExpired).toBe(true);
    });

    it('should handle custom expiry days', () => {
      const date = new Date();
      date.setDate(date.getDate() - 10);
      const isExpired = isPasswordExpired(date, 7);

      expect(isExpired).toBe(true);
    });

    it('should handle date strings', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      const isExpired = isPasswordExpired(oldDate.toISOString(), 90);

      expect(isExpired).toBe(true);
    });

    it('should handle boundary conditions', () => {
      const date = new Date();
      date.setDate(date.getDate() - 89);
      const isExpired = isPasswordExpired(date, 90);

      // Should be false because we're under 90 days
      expect(isExpired).toBe(false);
    });
  });

  describe('Password Security Integration', () => {
    it('should complete full hash and verify cycle', async () => {
      const password = 'MySecurePass123!@#';

      // Validate
      const validation = validatePasswordStrength(password);
      expect(validation.isValid).toBe(true);

      // Hash
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();

      // Verify correct
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      // Verify incorrect
      const isInvalid = await verifyPassword('WrongPassword123!', hash);
      expect(isInvalid).toBe(false);
    });

    it('should handle generated passwords correctly', async () => {
      const password = generateSecurePassword();

      // Should be valid
      const validation = validatePasswordStrength(password);
      expect(validation.isValid).toBe(true);

      // Should hash successfully
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();

      // Should verify correctly
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
  });
});
