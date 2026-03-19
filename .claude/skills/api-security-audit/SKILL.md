---
name: api-security-audit
description: Security audit checklist for Next.js API routes — auth guards, input validation, OWASP top 10
---

# API Security Audit

## Authentication Checks
- Every protected route calls `authenticateRequest(request)` before processing
- Auth failures return 401 with generic message (no information leakage)
- Token validation happens server-side only
- Session tokens are httpOnly, secure, sameSite=strict

## Authorization Checks
- Resource access uses `has_agent_access()` RPC, not raw ownership queries
- Role checks happen at the API layer, not just the UI
- Forbidden returns 403, not 404 (don't mask authorization as "not found")

## Input Validation
- All request bodies validated with Zod before processing
- File uploads: check MIME type, size limit (5MB default), sanitize filename
- URL parameters: validate format, reject path traversal (`..`)
- Query strings: whitelist allowed parameters

## OWASP Top 10 Checklist
1. **Injection**: Use parameterized queries (Supabase handles this)
2. **Broken Auth**: Token rotation, secure storage, proper logout
3. **Sensitive Data**: No secrets in logs, no PII in URLs
4. **XXE**: Not applicable (JSON-only APIs)
5. **Broken Access Control**: RLS + application-level checks
6. **Security Misconfiguration**: Check CORS, CSP headers
7. **XSS**: Sanitize user content before rendering, use React's built-in escaping
8. **Insecure Deserialization**: Validate JSON schemas strictly
9. **Known Vulnerabilities**: Check `npm audit` output
10. **Insufficient Logging**: Log auth failures, access denials, admin actions

## Rate Limiting
- Public endpoints: 60 req/min per IP
- Authenticated endpoints: 120 req/min per user
- File upload endpoints: 10 req/min per user
- Webhook endpoints: validate signature, no rate limit

## Response Headers
```typescript
// Required on all API responses
headers.set("X-Content-Type-Options", "nosniff")
headers.set("X-Frame-Options", "DENY")
headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
```
