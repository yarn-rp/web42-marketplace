# Claude Code Platform Guide

## Getting Started
To get started with Claude integration, run the following command:

```bash
web42 init
```
Select Claude from the list of available platforms.

## Agent Discovery
Your agents can be found in the following directories:
- `agents/`
- `.claude/agents/`

## Packing and Installation
### What’s Included
When you pack your projects, the following items will be included:
- Agent Markdown files
- Skills
- Commands
- Scripts

### Installation Options
You can install Claude agents in two ways:
- Locally through `.claude/` directory
- Globally using the command:

```bash
web42 install -g your-agent
```

## Security Model
The `stripForbiddenFrontmatter` ensures that the following elements are not included in marketplace agents:
- Hooks
- MCP Servers
- Permission Mode

When these features are blocked, it enhances the security posture of marketplace agents.

## Template Variables
You can use template variables such as:
- `{{CLAUDE_HOME}}`

This variable refers to the Claude installation home directory.