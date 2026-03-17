# Smoke test: agent avatar upload on `web42 push`

This verifies that an agent repo with an avatar PNG ends up with a non-null `agents.profile_image_url` after a CLI push.

## Preconditions

- Marketplace dev server running (or deployed environment reachable via `web42` CLI).
- CLI authenticated:
  - `web42 login`
- Your agent repo contains one of the supported avatar paths:
  - `avatar/avatar.png` (canonical)
  - `avatars/avatar.png`
  - `avatar.png`

## Steps

1. From the agent repo root, run:

   ```bash
   web42 push
   ```

2. Verify the agent record has a profile image URL.

   Option A — via UI:
   - Open the agent page (the CLI prints the URL).
   - Confirm the agent card/header renders the avatar.

   Option B — via DB (Supabase SQL editor):

   ```sql
   select slug, profile_image_url
   from public.agents
   where owner_id = auth.uid()
   order by updated_at desc
   limit 5;
   ```

   Expected:
   - `profile_image_url` is non-null and points at a public storage URL.

3. Regression: push with no avatar.
   - Temporarily move the avatar file away.
   - Re-run `web42 push`.

   Expected:
   - Push succeeds.
   - Agent remains valid; `profile_image_url` is unchanged.

## Notes

- The push flow **does not** attempt to include binary assets in the packed file list (`agent_files` upload) — it uploads only the avatar separately.
- Max avatar size enforced by both CLI and server: **2MB**.
