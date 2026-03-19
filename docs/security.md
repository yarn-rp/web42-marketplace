# Security Model

## `stripForbiddenFrontmatter`

When installing agents from the Web42 marketplace, the CLI automatically strips certain YAML frontmatter keys from Claude agent `.md` files before writing them to disk.

### Forbidden keys

| Key | Why it's blocked |
|-----|-----------------|
| `hooks` | Allows agents to run shell commands on Claude Code events (file save, tool use, etc.) — a marketplace agent should not be able to hook into the buyer's system |
| `mcpServers` | Configures MCP server connections — a marketplace agent should not be able to add unauthorized server connections to the buyer's Claude Code |
| `permissionMode` | Controls Claude Code's permission level — a marketplace agent should not be able to escalate its own permissions |

### Local vs marketplace agents

This stripping applies **only to marketplace-installed agents** (installed via `web42 install`). Your own local agents are not subject to this filter — you can use `hooks`, `mcpServers`, and `permissionMode` freely in agents you author yourself.

| | Your local agents | Marketplace agents |
|--|------------------|--------------------|
| `hooks` | ✅ Allowed | ❌ Stripped on install |
| `mcpServers` | ✅ Allowed | ❌ Stripped on install |
| `permissionMode` | ✅ Allowed | ❌ Stripped on install |

### When stripping occurs

Stripping happens at **install time**, not at publish time. The marketplace stores the original agent as-is. The buyer's CLI strips the forbidden keys before writing any file to their machine.

If keys are stripped, the CLI prints a warning:

```
Security: Stripped hooks, mcpServers from agent-name.md
```

### How it works

The `stripForbiddenFrontmatter` function parses the YAML frontmatter block (between `---` delimiters) and removes any top-level forbidden key along with its full value — including multi-line and nested values. The rest of the file is written unchanged.

---

## Path Traversal Protection

Every file path contained in a marketplace agent pack is validated before being written to disk. The resolved absolute path must remain within the install target directory. Any path that escapes the target (e.g. `../../etc/passwd`) is rejected with an error:

```
Path traversal detected: ../../etc/passwd
```

---

## Hardcoded Pack Excludes

When publishing an agent, the following are always excluded from the pack regardless of `.web42ignore` settings:

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

This prevents accidentally publishing local configuration, secrets, memory files, or project-specific data.

---

## Template Variable Sanitization

Absolute filesystem paths in agent content are replaced with portable placeholders during pack. This prevents your local username or home directory path from being embedded in published agents.

| Pattern replaced | Placeholder |
|-----------------|-------------|
| `/Users/<name>/.claude` | `{{CLAUDE_HOME}}` |
| `/home/<name>/.claude` | `{{CLAUDE_HOME}}` |
| `C:\Users\<name>\.claude` | `{{CLAUDE_HOME}}` |
| `~/.claude` | `{{CLAUDE_HOME}}` |

Placeholders are resolved back to real paths on the buyer's machine at install time.
