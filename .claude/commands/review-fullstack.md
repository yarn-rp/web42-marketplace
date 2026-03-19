# /review-fullstack

Run a comprehensive review of recent changes against all fullstack conventions.

Steps:
1. Run `git diff --stat` to see what changed
2. For API routes: check auth guards, Zod validation, RLS compliance
3. For components: check server/client boundaries, accessibility, Radix usage
4. For database: check RLS policies, migration reversibility, indexes
5. For CLI: check adapter compliance, content hashing, path safety
6. Run the security audit checklist on any new API endpoints
7. Check test coverage for new code
8. Profile performance impact of changes

Output a structured report with Critical / Warning / Info sections.
