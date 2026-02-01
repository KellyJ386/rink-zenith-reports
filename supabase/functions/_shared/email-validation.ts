/**
 * Shared email validation utilities for edge functions
 */

/**
 * Validates email format following RFC 5321 standards
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // RFC 5321 length limits
  if (email.length > 254) return false;
  
  const [local, domain] = email.split('@');
  if (!local || !domain) return false;
  if (local.length > 64) return false;
  
  // Check for dangerous characters that could be used for injection
  if (/[\r\n\t]/.test(email)) return false;
  
  return true;
}

/**
 * Validates an array of email addresses
 * Returns { valid: string[], invalid: string[] }
 */
export function validateEmailArray(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const email of emails) {
    if (isValidEmail(email)) {
      valid.push(email.trim().toLowerCase());
    } else {
      invalid.push(email);
    }
  }
  
  return { valid, invalid };
}

/**
 * Sanitizes email subject to prevent header injection
 * Removes newlines, carriage returns, tabs, and truncates to max length
 */
export function sanitizeSubject(subject: string | undefined, defaultSubject: string, maxLength: number = 200): string {
  if (!subject || typeof subject !== 'string') return defaultSubject;
  
  // Remove control characters that could be used for header injection
  const sanitized = subject
    .replace(/[\r\n\t\0]/g, '')
    .trim()
    .substring(0, maxLength);
  
  return sanitized || defaultSubject;
}

/**
 * Escapes HTML entities in text content to prevent XSS in email templates
 */
export function escapeHtmlForEmail(text: string | null | undefined): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m] || m);
}
