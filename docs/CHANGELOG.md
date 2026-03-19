## Changelog

### Version 0.2.0
- Added Claude as a supported platform in CLI.
- Introduced `ClaudeAdapter` for platform-specific behavior.
- Updated the security model to include the `stripForbiddenFrontmatter` mechanism, blocking hooks/mcpServers/permissionMode for marketplace agents.

### Breaking Changes
- Version bump impacts OpenClaw CLI users. If not using the Claude platform, update strategies may need to adjust.