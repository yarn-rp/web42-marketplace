# File Hygiene Checklist

Before packing, audit the workspace for files that should not ship to buyers. The CLI's pack command automatically excludes some patterns, but manual review catches everything else.

## Automatically Excluded by the CLI

These patterns are hardcoded in the pack command and will never appear in the `.web42/` artifact:

| Pattern | Reason |
|---------|--------|
| `auth-profiles.json` | Platform authentication credentials |
| `MEMORY.md` | Creator's long-term memory — personal context |
| `memory/**` | Daily memory logs — personal context |
| `sessions/**` | Session history — personal context |
| `.git/**` | Version control internals |
| `node_modules/**` | Dependencies (not portable) |
| `.DS_Store` | macOS filesystem metadata |
| `*.log` | Log files |
| `openclaw.json` | Platform config (contains agent bindings, channel secrets) |
| `.openclaw/credentials/**` | Platform credentials |
| `.web42/**` | Previous pack artifacts |
| `.web42ignore` | Pack ignore config (meta, not content) |
| `manifest.json` | Shipped separately as structured data |
| `USER.md` | Always rewritten with a blank template on install |

## Files to Flag for Manual Review

These are NOT auto-excluded but often contain content that should not ship:

### Personal Data

- **`HEARTBEAT.md`** — If it contains creator-specific tasks, reminders, or routines. Reset to the scaffold default (empty with comments) unless the tasks are part of the agent's intended behavior.
- **`SOUL.md`** — If it references the creator by name, contains personal preferences, or has inside jokes. Generalize to describe the agent's intended persona, not the creator's personality.
- **`IDENTITY.md`** — If it contains the creator's chosen name/emoji/avatar. The buyer's agent should form its own identity. Reset to the scaffold template or write a persona description that fits the agent's purpose.
- **`TOOLS.md`** — If it contains the creator's SSH hosts, camera names, device nicknames, etc. Reset to the scaffold template with example placeholders.

### Secrets and Credentials

- **`.env` / `.env.local`** — Should never be in the workspace root. If present, flag immediately.
- **`.web42.config.json`** — Contains config variable values from the creator's install. Must not ship.
- **Hardcoded API keys in skill files** — The CLI strips known patterns (`sk-...`, `ghp_...`, bearer tokens), but custom keys may slip through. Grep for suspicious patterns: long hex/base64 strings, `token`, `secret`, `password`, `apikey`.

### Development Artifacts

- **`.vscode/` / `.cursor/` / `.idea/`** — IDE configuration. Not relevant to buyers.
- **`__pycache__/` / `*.pyc`** — Python bytecode.
- **`Thumbs.db`** — Windows thumbnail cache.
- **`*.bak` / `*.swp` / `*.tmp`** — Editor backup/swap files.
- **`test/` / `tests/` / `__tests__/`** — Test files, unless they are part of the agent's functionality.
- **Build outputs** — `dist/`, `build/`, `out/` directories.

### Large or Binary Files

- The pack command skips files larger than 1 MB.
- Binary files (images, compiled executables) are skipped automatically (UTF-8 decode failure).
- If the agent needs images (e.g., for the README cover), use `coverImage` in the manifest or host them externally.

## Using `.web42ignore`

Create a `.web42ignore` file in the workspace root to exclude additional patterns. Syntax follows `.gitignore`:

```
# Exclude test fixtures
tests/**
fixtures/**

# Exclude draft documents
drafts/**

# Exclude local scripts not part of the agent
scripts/local-*.sh
```

The `.web42ignore` file itself is automatically excluded from the artifact.

## Verification

After auditing, always run:

```
web42 pack --dry-run
```

This prints every file that would be included. Review the list for:

1. **Unexpected files** — anything you don't recognize or didn't intend to ship
2. **File count** — a typical agent has 5–30 files. Hundreds of files suggests something is wrong.
3. **Sensitive content** — spot-check a few files for leaked secrets or personal data
