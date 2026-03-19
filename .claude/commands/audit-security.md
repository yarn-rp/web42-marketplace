# /audit-security

Run a focused security audit on the current codebase.

Steps:
1. Scan all API routes for missing `authenticateRequest()` calls
2. Check for hardcoded secrets or API keys in source files
3. Verify all file upload endpoints validate MIME type and size
4. Check CORS configuration in `next.config.js`
5. Run `npm audit` and report vulnerabilities
6. Verify Stripe webhook signature validation
7. Check for SQL injection vectors (should be none with Supabase)
8. Validate CSP and security headers

Output findings with severity: Critical / High / Medium / Low.
