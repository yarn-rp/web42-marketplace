# Claude Code Platform Guide

Web42 supports [Claude Code](https://claude.ai) as a first-class platform. You can publish agents built for Claude Code to the Web42 marketplace and install marketplace agents directly into your Claude Code setup — either project-local or globally.

---

## Getting Started

### Initialize a Claude agent

```bash
web42 init
```

Select **Claude** from the platform list. The CLI will walk you through naming your agent and setting it up for the marketplace.

### Push to marketplace

```bash
web42 push
```

### Install from marketplace

```bash
# Local install (installs into .claude/ in the current project)
web42 install @username/agent-name

# Global install (installs into ~/.claude/)
web42 install -g @username/agent-name

# Install under a custom local name
web42 install @username/agent-name --as my-agent
```

---

## Directory Structure

Web42 discovers and packs Claude agents using the following conventions:

### Agent files

Web42 looks for agent `.md` files in:

| Path | Description |
|------|-------------|
| `agents/<name>.md` | Standalone agent dir or inside `~/.claude/` |
| `.claude/agents/<name>.md` | Project-local agents |
| `~/.claude/agents/<name>.md` | Global agents (searched if cwd ≠ `~/.claude`) |

### Skills

Skills referenced in agent frontmatter are resolved from:

- `skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md`
- `~/.claude/skills/<name>/SKILL.md`

### Commands

Custom slash commands are packed from:

- `commands/`
- `.claude/commands/`

### Hardcoded excludes

The following are always excluded from packs, regardless of `.web42ignore`:

```
.claude/settings*
.claude/settings.json
.claude/settings.local.json
.claude/projects/**
.claude/plugins/**
memory/**
MEMORY.md
.git/**
node_modules/**
.DS_Store
*.log
.web42/**
.web42ignore
manifest.json
.env
.env.*
```

---

## Local vs Global Install

Claude Code supports two install scopes. Web42 mirrors this with the `-g` flag.

### Local install (default)

```bash
web42 install @username/agent-name
```

Files land in `.claude/` inside your **current working directory**. The agent is only available when Claude Code is opened in that project.

Use this when the agent is purpose-built for a specific repo or project.

### Global install

```bash
web42 install -g @username/agent-name
```

Files land in `~/.claude/`. The agent is available globally — in every Claude Code session, regardless of which project you have open.

Use this for general-purpose agents (writing assistants, code reviewers, tools you want everywhere).

### Custom name

```bash
web42 install @username/agent-name --as my-custom-name
```

Installs the agent under a different local name. Useful when you want to run multiple versions of the same agent side by side.

---

## Template Variables

When you publish an agent, hardcoded filesystem paths are automatically sanitized to portable placeholders. At install time, placeholders are resolved back to real paths on the buyer's machine.

| Placeholder | Resolved to |
|-------------|-------------|
| `{{CLAUDE_HOME}}` | `~/.claude` (platform-aware: macOS, Linux, Windows) |

### Example

An agent that references `~/.claude/skills/my-skill/SKILL.md` in its source will be published with `{{CLAUDE_HOME}}/skills/my-skill/SKILL.md`. When installed, it becomes the correct absolute path on whatever machine the buyer is using.

**Patterns sanitized on pack:**

```
/Users/<name>/.claude  →  {{CLAUDE_HOME}}
/home/<name>/.claude   →  {{CLAUDE_HOME}}
C:\Users\<name>\.claude →  {{CLAUDE_HOME}}
~/.claude              →  {{CLAUDE_HOME}}
```

**Reserved variable names** (cannot be used as config variables): `CLAUDE_HOME`, `WORKSPACE`.

---

## Config Variables

Agents can declare runtime configuration variables that users fill in at install time.

Declare them in the agent's YAML frontmatter:

```yaml
---
name: My Agent
description: Does useful things
variables:
  - name: API_KEY
    description: Your API key for the service
    required: true
  - name: PREFERRED_LANGUAGE
    description: Default language for responses
    required: false
---
```

Use them in any file with `{{VARIABLE_NAME}}`:

```
Your API key is {{API_KEY}}.
Respond in {{PREFERRED_LANGUAGE}} by default.
```

The CLI prompts the user for values at install time and replaces all placeholders before writing files.

---

## Pack Contents

When you run `web42 push`, the CLI packs the following:

| Item | Included |
|------|----------|
| Agent `.md` file | ✅ |
| Skill `SKILL.md` files (referenced in frontmatter) | ✅ |
| Command files (`commands/*.md`) | ✅ |
| Script files referenced by skills | ✅ |
| Settings files (`.claude/settings*`) | ❌ |
| Projects directory (`.claude/projects/`) | ❌ |
| Memory files (`MEMORY.md`, `memory/`) | ❌ |
| Environment files (`.env`, `.env.*`) | ❌ |
| `.git/`, `node_modules/` | ❌ |

---

## Security Model

### Marketplace agents vs local agents

Web42 applies a security filter to **marketplace-installed agents** that does not apply to your own local agents. This distinction matters.

| | Local agent (yours) | Marketplace agent (installed via web42) |
|--|--------------------|-----------------------------------------|
| `hooks` | ✅ Allowed | ❌ Stripped on install |
| `mcpServers` | ✅ Allowed | ❌ Stripped on install |
| `permissionMode` | ✅ Allowed | ❌ Stripped on install |

### Why these keys are stripped

Claude Code's `hooks`, `mcpServers`, and `permissionMode` frontmatter keys control system-level behavior: shell hooks, MCP server connections, and permission escalation. Allowing marketplace agents to ship with these intact would let a published agent silently modify a buyer's Claude Code security posture.

The `stripForbiddenFrontmatter` function strips these keys from agent `.md` files **at install time** — before any file is written to disk. If keys are stripped, the CLI emits a warning:

```
Security: Stripped hooks, mcpServers from agent-name.md
```

### Path traversal protection

Every file path in a pack is validated against the install root before writing. Any path that resolves outside the target directory is rejected:

```
Path traversal detected: ../../etc/passwd
```

---

## Tracking Installed Agents

Web42 tracks what it installs in `.web42/installed.json` (local) or `~/.claude/.web42/installed.json` (global). This enables clean uninstall:

```bash
web42 uninstall agent-name
```

The uninstall command removes every file that was originally installed and cleans up empty directories. Files that weren't installed by web42 are left untouched.
