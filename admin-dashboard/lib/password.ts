import 'server-only';
import bcrypt from 'bcryptjs';

// Security configuration
const BCRYPT_ROUNDS = 12; // Cost factor for bcrypt (2^12 iterations)
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
  minLength: MIN_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must be at most ${MAX_PASSWORD_LENGTH} characters`);
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return hash;
}

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Bcrypt hash to compare against
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Validate password strength
 * @param password Password to validate
 * @returns Object with isValid flag and error messages
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check length
  if (!password || password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`
    );
  }

  if (password && password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be at most ${MAX_PASSWORD_LENGTH} characters long`);
  }

  if (!password) {
    return {
      isValid: false,
      errors,
      suggestions: ['Choose a strong, unique password'],
    };
  }

  // Check for uppercase letters
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add an uppercase letter (A-Z)');
  }

  // Check for lowercase letters
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add a lowercase letter (a-z)');
  }

  // Check for numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add a number (0-9)');
  }

  // Check for special characters
  if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    const specialCharsRegex = new RegExp(
      `[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`
    );
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character');
      suggestions.push(
        `Add a special character (${PASSWORD_REQUIREMENTS.specialChars})`
      );
    }
  }

  // Check for common patterns (additional security)
  const commonPatterns = [
    { pattern: /^(.)\1+$/, message: 'Password cannot be all the same character' },
    { pattern: /^(012|123|234|345|456|567|678|789|890)+/i, message: 'Avoid sequential numbers' },
    { pattern: /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i, message: 'Avoid sequential letters' },
    { pattern: /password|12345|qwerty|admin|letmein/i, message: 'Avoid common passwords' },
  ];

  for (const { pattern, message } of commonPatterns) {
    if (pattern.test(password)) {
      suggestions.push(message);
    }
  }

  // Check password strength level
  const hasMultipleCharTypes =
    [
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

  if (password.length >= MIN_PASSWORD_LENGTH && hasMultipleCharTypes < 3) {
    suggestions.push('Use a mix of uppercase, lowercase, numbers, and symbols for better security');
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
  };
}

/**
 * Generate a secure random password
 * Useful for creating temporary passwords during migration
 * @param length Password length (default 16)
 * @returns Random password meeting all requirements
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = PASSWORD_REQUIREMENTS.specialChars;

  const allChars = uppercase + lowercase + numbers + specialChars;

  // Ensure at least one of each required type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check if password needs to be changed (e.g., too old)
 * @param passwordChangedAt When password was last changed
 * @param maxAgeDays Maximum age in days (default 90)
 * @returns True if password should be changed
 */
export function isPasswordExpired(
  passwordChangedAt: Date | string,
  maxAgeDays: number = 90
): boolean {
  const changedAt = new Date(passwordChangedAt);
  const now = new Date();
  const daysSinceChange = (now.getTime() - changedAt.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceChange > maxAgeDays;
}
