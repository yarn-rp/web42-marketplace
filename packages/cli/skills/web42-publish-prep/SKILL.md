---
name: web42-publish-prep
description: "This skill should be used when the user asks to 'prepare my agent for Web42', 'publish to Web42', 'set up web42 CLI', 'create a manifest', 'write an agent README', 'set up marketplace pricing', 'add screenshots', 'clean up files before pushing', 'init web42', or needs help packaging an agent project for the Web42 marketplace. Guides the full lifecycle from init through push-ready state, including marketplace configuration, visual assets, and sync."
internal: true
metadata:
  clawdbot:
    emoji: "📦"
    requires:
      anyBins: ["web42"]
    os: ["linux", "darwin", "win32"]
---

# Web42 Publish Prep

Prepare an agent project for publishing to the Web42 marketplace. This skill covers the full lifecycle: initializing the project, populating the manifest, configuring marketplace settings (pricing, license, tags), preparing visual assets (avatar, screenshots, demo media), writing a compelling README, auditing workspace files, and validating everything before push.

## When to Activate

Activate when the user wants to get their agent ready for the Web42 marketplace — whether starting from scratch or cleaning up an existing project before push.

## Prerequisites

- The Web42 CLI must be installed (`brew install web42` or via the install script).
- The user must be authenticated (`web42 auth login`). Verify with `web42 auth whoami`.
- The workspace must contain a supported platform config (currently OpenClaw — `openclaw.json`).

If any prerequisite is missing, guide the user through resolving it before proceeding.

## Workflow

### Phase 1 — Initialize the Project

Check whether `manifest.json` already exists in the workspace root.

- **If missing:** Run `web42 init` interactively. The CLI prompts for platform, description, version, and detects skills from `skills/*/SKILL.md`. It also scaffolds the `.web42/` metadata folder with `marketplace.json` and `resources.json`.
- **If present:** Read and validate the existing manifest against the field reference in `references/manifest-fields.md`. Report any missing or invalid fields.

After init, verify that these exist:

1. **Platform files:** `AGENTS.md`, `IDENTITY.md`, `SOUL.md`, `TOOLS.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `USER.md` — if the user already customized these, do not overwrite.
2. **`.web42/` folder:** `marketplace.json`, `resources.json`, `resources/` directory. See `references/web42-folder.md` for the complete structure.

### Phase 2 — Enrich the Manifest

Read the current `manifest.json` and walk through each field with the user. Consult `references/manifest-fields.md` for the full field reference.

Key actions:

1. **`name`** — Confirm it is lowercase-hyphenated and reflects the agent's purpose. Suggest alternatives if generic.
2. **`description`** — Must be 1–500 characters. Draft a concise, benefit-oriented description that tells a potential buyer what the agent *does for them*.
3. **`version`** — Ensure semver format (`MAJOR.MINOR.PATCH`).
4. **`skills`** — Auto-detected from `skills/*/SKILL.md`. If none found, ask if skills should be documented.
5. **`configVariables`** — For each detected secret/config, ensure `label` and `description` are clear enough for a buyer.
6. **`modelPreferences`** — Set `primary` to the intended model. Optionally set a `fallback`.

Write the updated `manifest.json` only after user confirmation.

### Phase 3 — Configure Marketplace Settings

Read `.web42/marketplace.json` and walk through each field. Consult `references/marketplace-config.md` for the full reference.

Key actions:

1. **`price_cents`** — Ask the user about their pricing strategy. Free (`0`) or paid? For paid agents, suggest a price based on the agent's capabilities and target audience. Explain that pricing can be changed later.
2. **`currency`** — Currently only `"usd"`. Confirm and leave as default.
3. **`license`** — Help choose. For free agents: suggest `"MIT"` or `"Apache-2.0"`. For paid agents: suggest `"Proprietary"`. Explain the implications briefly.
4. **`tags`** — Suggest 3–6 searchable tags. Mix category terms ("finance", "devops") with capability terms ("slack-integration", "pdf-generation"). Think about what a buyer would search for.

Write `.web42/marketplace.json` only after user confirmation.

**Important:** Visibility (`public`/`private`/`unlisted`) is managed exclusively through the Web42 dashboard, not through local files. Remind the user that the agent starts private and they should toggle visibility on the dashboard when ready to launch.

### Phase 4 — Prepare Visual Assets

Visual assets are what make a marketplace listing stand out. Walk through each:

#### Avatar

Check if `.web42/avatar.{png,jpg,webp,svg}` exists.

- If missing, ask the user if they want to provide or generate one.
- **Recommended:** 400x400 or larger, square, PNG or WebP.
- The avatar appears on the marketplace listing, search results, and the agent's profile.
- If the user wants to generate one, help create a prompt that captures the agent's personality and purpose.

#### Resources (Screenshots, Videos, Documents)

Check `.web42/resources.json` and `.web42/resources/`. Consult `references/resources-guide.md`.

- **Screenshots** — The single most impactful asset. Ask the user to capture 2–4 screenshots showing the agent in action. Recommend 1200x800 or 1600x900 (landscape).
- **Demo video** — A 1–3 minute recording showing the agent's core workflow. Dramatically improves conversion. Can be a screen recording with voiceover.
- **Documents** — Optional setup guides or architecture overviews as PDF.

For each resource:

1. Help the user save files to `.web42/resources/`.
2. Create or update `.web42/resources.json` with metadata (`file`, `title`, `description`, `type`, `sort_order`).
3. Put the strongest visual first (`sort_order: 0`).

### Phase 5 — Write the README

The README is the storefront — the agent's pitch deck. Read `assets/readme-template.md` for inspiration, then write a README that lets the agent's personality shine.

Principles:

- **Lead with outcomes, not internals.** Paint the picture of life *with* this agent.
- **Show personality.** Write in the agent's own voice — confident, creative, even playful.
- **Use rich media.** Reference screenshots from `.web42/resources/`, embed demo videos, include links. The marketplace renders full Markdown.
- **Give concrete scenarios.** "Ask me to..." or "Imagine you need to..." — make it visceral.
- **Include practical info** (install command, required config) but don't let it dominate.
- **Don't reveal the recipe.** Focus on outcomes, not system prompts or internal file structures.

Write to `README.md` at workspace root. If one already exists, show a diff and ask before overwriting.

### Phase 6 — Audit Workspace Files

Before packing, scan the workspace for files that should not ship to buyers. Consult `references/file-hygiene.md` for the full checklist.

Common issues to flag:

- **Personal data:** `USER.md`, `MEMORY.md`, `memory/` directory, `HEARTBEAT.md` with creator-specific tasks
- **Secrets:** `.env`, `.env.local`, API keys hardcoded in files, `.web42.config.json`
- **Development artifacts:** `node_modules/`, `.git/`, IDE configs, build outputs
- **Platform junk:** `.DS_Store`, `Thumbs.db`, `__pycache__/`
- **Overly personal SOUL.md or IDENTITY.md:** Suggest generalizing if they reference the creator rather than the agent persona

For each flagged item:

1. Explain why it might be a problem.
2. Ask the user whether to remove, reset to scaffold default, or keep it.
3. If unsure, recommend `web42 pack --dry-run` to preview the bundle.

### Phase 7 — Validate, Pack, and Sync

Run `web42 pack --dry-run` to show exactly what files will be included in `.web42/dist/`. Review together:

- Confirm file count and total size are reasonable.
- Verify no secrets leaked (the CLI strips known patterns, but manual review catches edge cases).
- Ensure `README.md` is present.
- Ensure `.web42/marketplace.json` has pricing, license, and tags set.
- Ensure at least one screenshot or resource exists in `.web42/resources/`.

When clean, the user can publish:

1. **`web42 push`** — Packs (if needed), pushes the full snapshot (manifest, README, marketplace config, files, avatar, resources) to the remote.
2. **`web42 sync`** — Check sync status at any time to see if local and remote are aligned.
3. **Dashboard** — Remind the user to visit `web42.ai` to set visibility to `public` or `unlisted` when ready.

After the first push, subsequent changes follow the sync workflow:

- Edit locally → `web42 push` to sync up
- Edit on dashboard → `web42 pull` to sync down
- `web42 sync` to check status without changing anything
- `--force` flag on push/pull to override when both sides have changed

## CLI Quick Reference

| Command | Purpose |
|---------|---------|
| `web42 auth login` | Authenticate via GitHub OAuth |
| `web42 auth whoami` | Check current auth status |
| `web42 init` | Scaffold `manifest.json` + `.web42/` metadata folder |
| `web42 pack --dry-run` | Preview packaged files without writing |
| `web42 pack` | Bundle workspace into `.web42/dist/` |
| `web42 push` | Pack (if needed) and sync everything to the marketplace |
| `web42 push --force` | Push even if no local changes detected |
| `web42 pull` | Fetch latest state from the marketplace to local files |
| `web42 pull --force` | Pull even if no remote changes detected |
| `web42 sync` | Show sync status (local vs remote hash comparison) |

## Resources

### References
- **`references/web42-folder.md`** — Complete `.web42/` folder structure reference.
- **`references/manifest-fields.md`** — `manifest.json` field reference with types, constraints, and guidance.
- **`references/marketplace-config.md`** — `.web42/marketplace.json` field reference with pricing and license guidance.
- **`references/resources-guide.md`** — Resource types, schema, dimensions, and best practices for screenshots/videos/docs.
- **`references/file-hygiene.md`** — Checklist of files and patterns to audit before packing.

### Assets
- **`assets/readme-template.md`** — Inspirational README template for the marketplace storefront.
