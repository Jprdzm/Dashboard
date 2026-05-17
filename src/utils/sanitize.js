/**
 * Sanitize user input to prevent basic XSS and injection attacks.
 * It strips any HTML/XML tags from the input string.
 * @param {string} str - The input string to sanitize.
 * @returns {string} The sanitized string.
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  // Remove all HTML/XML tags
  return str.replace(/<[^>]*>?/gm, '').trim();
}
