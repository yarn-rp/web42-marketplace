---
name: fullstack-conventions
description: Next.js App Router + Supabase + Stripe conventions for the web42 marketplace
---

# Fullstack Conventions

## Project Structure
- `app/` — Next.js App Router pages and API routes
- `components/` — Shared React components (server-first)
- `lib/` — Utilities, auth helpers, Supabase clients
- `db/` — Database schema, migrations, seed data
- `packages/cli/` — The @web42/cli package
- `hooks/` — React hooks (client-side only)

## API Routes
- File: `app/api/{resource}/route.ts`
- Always export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Always call `authenticateRequest(request)` first for protected routes
- Use `createClient()` for authenticated queries (respects RLS)
- Use `createServiceClient()` ONLY in webhooks and system operations
- Return `NextResponse.json({ error: "..." }, { status: 4xx })` for errors
- Validate bodies with Zod: `const body = schema.parse(await request.json())`

## Components
- Server components by default
- Add `"use client"` only when using hooks, event handlers, or browser APIs
- Use Radix UI for primitives (Dialog, DropdownMenu, Popover, etc.)
- Use `cn()` utility for conditional classNames (Tailwind)
- All prices: store as `price_cents` (integer), display as `$X.XX`

## Database (Supabase)
- All tables must have RLS policies
- Use `has_agent_access()` RPC for access control checks
- Migrations in `supabase/migrations/` — always reversible
- Use `supabase gen types` after schema changes

## TypeScript
- Strict mode enabled
- No `any` without explicit justification comment
- Prefer `interface` over `type` for object shapes
- Named exports only — no default exports
