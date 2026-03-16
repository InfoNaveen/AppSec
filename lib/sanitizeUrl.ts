/**
 * Sanitize URL to strip sensitive credentials like GitHub Personal Access Tokens
 * Replaces ://[token]@ with ://[REDACTED]@
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  // SECURITY FIX: GitHub Token Leak (credential stripping)
  return url.replace(/:\/\/([^@/]+)@/g, '://[REDACTED]@');
}
