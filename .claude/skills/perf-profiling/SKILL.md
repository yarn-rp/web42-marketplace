---
name: perf-profiling
description: Performance profiling patterns for Next.js — bundle analysis, React re-renders, database queries
---

# Performance Profiling

## React Re-render Detection
- Look for components missing `React.memo()` or `useMemo()`
- Check for inline object/array creation in JSX props
- Verify `useCallback` wraps event handlers passed to child components
- Flag `useEffect` dependencies that change every render

## Bundle Size
- Run `npx next build --debug` and check `.next/analyze/` output
- Flag imports that pull entire libraries (e.g., `import _ from "lodash"`)
- Prefer specific imports: `import { debounce } from "lodash/debounce"`
- Check for duplicate dependencies in `pnpm-lock.yaml`

## Database Query Performance
- Run `EXPLAIN ANALYZE` on complex queries
- Flag missing indexes on columns used in WHERE, JOIN, ORDER BY
- Check for N+1 patterns: loops that execute individual queries
- Prefer batch operations: `IN (...)` over multiple `= ?`

## Image Optimization
- All images must use `next/image` component
- Set explicit `width` and `height` to prevent layout shift
- Use `priority` prop for above-the-fold images
- Serve WebP format with fallbacks

## Caching Strategy
- Static pages: `export const revalidate = 3600` (1 hour)
- API routes: `Cache-Control: public, s-maxage=60, stale-while-revalidate`
- Database queries: use Supabase's built-in caching where available
- Client-side: SWR or React Query with appropriate stale times
