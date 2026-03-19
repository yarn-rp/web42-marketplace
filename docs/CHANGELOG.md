## Changelog

### Version 0.2.0

#### Claude Code platform support

- Added `ClaudeAdapter` — full platform adapter for Claude Code agents
- Agent discovery across `agents/`, `.claude/agents/`, and `~/.claude/agents/`
- Skill resolution from `skills/`, `.claude/skills/`, and `~/.claude/skills/`
- Command packing from `commands/` and `.claude/commands/`
- Local install (`.claude/` in cwd) and global install (`~/.claude/`) via `-g` flag
- `--as <name>` flag to install under a custom local agent name
- `{{CLAUDE_HOME}}` template variable — absolute paths sanitized on pack, resolved at install time (macOS, Linux, Windows)
- Config variables declared in agent frontmatter, prompted at install time
- `stripForbiddenFrontmatter` security filter — strips `hooks`, `mcpServers`, and `permissionMode` from marketplace-installed agents at install time
- Path traversal protection on all file writes during install
- Install tracking via `.web42/installed.json` enabling clean uninstall
- Added `docs/platforms/claude.md` — full Claude platform developer guide

#### API changes

- `GET /api/agents`: authenticated CLI requests can now retrieve private/unlisted agents owned by the requester (bypasses RLS via admin client)
- `POST /api/agents`: marketplace-sensitive fields (`price_cents`, `currency`, `license`, `visibility`) are only set on agent creation — updates via CLI cannot change them (must use dashboard)
- Added `lib/auth/cli-auth.ts` — unified CLI Bearer token + session auth
- Added `lib/sync/agent-sync.ts` — agent hash computation for sync

#### CLI

- CLI version bumped to `0.2.0`
- Claude platform added to platform registry alongside OpenClaw
- `web42 init`, `push`, `pull`, `install`, `pack` all support Claude platform
