---
name: web42-publish-prep
description: "This skill should be used when the user asks to 'prepare my agent for Web42', 'publish to Web42', 'set up web42 CLI', 'create a manifest', 'write an agent README', 'clean up files before pushing', 'init web42', or needs help packaging an agent project for the Web42 marketplace. Guides the full lifecycle from init through push-ready state."
internal: true
metadata:
  clawdbot:
    emoji: "📦"
    requires:
      anyBins: ["web42"]
    os: ["linux", "darwin", "win32"]
---

# Web42 Publish Prep

Prepare an agent project for publishing to the Web42 marketplace. This skill covers the full lifecycle: initializing the project, populating the manifest, writing a compelling README, and auditing workspace files so only the right content ships to users.

## When to Activate

Activate when the user wants to get their agent ready for the Web42 marketplace — whether starting from scratch or cleaning up an existing project before push.

## Prerequisites

- The Web42 CLI must be installed (`npx web42-cli` or globally via `npm i -g web42-cli`).
- The user must be authenticated (`web42 auth login`). Verify with `web42 auth whoami`.
- The workspace must contain a supported platform config (currently OpenClaw — `openclaw.json`).

If any prerequisite is missing, guide the user through resolving it before proceeding.

## Workflow

### Phase 1 — Initialize the Project

Check whether `manifest.json` already exists in the workspace root.

- **If missing:** Run `web42 init` interactively. The CLI prompts for platform, description, version, and detects skills from `skills/*/SKILL.md`.
- **If present:** Read and validate the existing manifest against the field reference in `references/manifest-fields.md`. Report any missing or invalid fields.

After init, verify that the scaffolded platform files exist (`AGENTS.md`, `IDENTITY.md`, `SOUL.md`, `TOOLS.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `USER.md`). If the user already customized these, do not overwrite — just confirm they are present.

### Phase 2 — Enrich the Manifest

Read the current `manifest.json` and walk through each field with the user. Consult `references/manifest-fields.md` for the full field reference.

Key actions:

1. **`name`** — Confirm it is lowercase-hyphenated and reflects the agent's purpose. Suggest alternatives if generic.
2. **`description`** — Must be 1–500 characters. Draft a concise, benefit-oriented description that tells a potential buyer what the agent *does for them*.
3. **`version`** — Ensure semver format (`MAJOR.MINOR.PATCH`).
4. **`tags`** — Suggest 3–6 relevant tags for discoverability.
5. **`skills`** — Auto-detected from `skills/*/SKILL.md`. If none found, ask if skills should be documented.
6. **`configVariables`** — For each detected secret/config, ensure `label` and `description` are clear enough for a buyer.
7. **`modelPreferences`** — Set `primary` to the intended model. Optionally set a `fallback`.
8. **`coverImage`** — Ask if the user has a cover image (path relative to workspace).
9. **`demoVideoUrl`** — Ask if there is a demo video URL to include.

Write the updated `manifest.json` only after user confirmation.

### Phase 3 — Write the README

The README is the storefront — the agent's pitch deck. Read `assets/readme-template.md` for inspiration, then write a README that lets the agent's personality shine.

Principles:

- **Lead with outcomes, not internals.** Paint the picture of life *with* this agent.
- **Show personality.** Write in the agent's own voice — confident, creative, even playful.
- **Use rich media.** GIFs, demo videos, screenshots, embedded links. The marketplace renders full Markdown.
- **Give concrete scenarios.** "Ask me to..." or "Imagine you need to..." — make it visceral.
- **Include practical info** (install command, required config) but don't let it dominate.
- **Don't reveal the recipe.** Focus on outcomes, not system prompts or internal file structures.

Write to `README.md` at workspace root. If one already exists, show a diff and ask before overwriting.

### Phase 4 — Audit Workspace Files

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

### Phase 5 — Validate and Preview

Run `web42 pack --dry-run` to show exactly what files will be included. Review together:

- Confirm file count and total size are reasonable.
- Verify no secrets leaked (the CLI strips known patterns, but manual review catches edge cases).
- Ensure `README.md` is present (push reads it from workspace root).

When clean, inform the user they can publish with `web42 push`. The agent is created **private** by default — remind them to toggle visibility on the marketplace when ready.

## CLI Quick Reference

| Command | Purpose |
|---------|---------|
| `web42 auth login` | Authenticate via GitHub OAuth |
| `web42 auth whoami` | Check current auth status |
| `web42 init` | Scaffold `manifest.json` + platform files |
| `web42 pack --dry-run` | Preview packaged files without writing |
| `web42 pack` | Bundle into `.web42/` directory |
| `web42 push` | Pack (if needed) and upload to marketplace |
| `web42 pull` | Fetch latest published files back locally |

## Resources

### References
- **`references/manifest-fields.md`** — Complete manifest.json field reference with types, constraints, and guidance.
- **`references/file-hygiene.md`** — Checklist of files and patterns to audit before packing.

### Assets
- **`assets/readme-template.md`** — Inspirational README template for the marketplace storefront.
