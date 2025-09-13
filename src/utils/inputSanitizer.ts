/**
 * Utility functions for input sanitization and validation
 */

// Remove potentially dangerous characters and limit length
export const sanitizeText = (input: string, maxLength: number = 500): string => {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potential HTML/script injection chars
    .substring(0, maxLength);
};

// Sanitize email input
export const sanitizeEmail = (email: string): string => {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, '') // Only allow word chars, @, dots, and hyphens
    .substring(0, 254); // Max email length per RFC
};

// Validate and sanitize phone number
export const sanitizePhone = (phone: string): string => {
  return phone
    .trim()
    .replace(/[^\d\s\-\+\(\)]/g, '') // Only allow digits, spaces, and common phone chars
    .substring(0, 20);
};

// Validate password strength
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain repeated characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Rate limiting helper (client-side basic implementation)
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, { count: number; firstAttempt: number }>();
  
  return (key: string): boolean => {
    const now = Date.now();
    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }
    
    // Reset if window has passed
    if (now - userAttempts.firstAttempt > windowMs) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }
    
    // Check if limit exceeded
    if (userAttempts.count >= maxAttempts) {
      return false;
    }
    
    // Increment attempts
    userAttempts.count++;
    return true;
  };
};