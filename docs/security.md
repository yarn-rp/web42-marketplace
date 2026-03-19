# Security Model Documentation

## `stripForbiddenFrontmatter`
The `stripForbiddenFrontmatter` feature is crucial for maintaining security within marketplace agents. This mechanism ensures that certain elements are stripped from agents before deployment:
- **Hooks**: Any hooks that might expose internal processes are removed.
- **MCP Servers**: These are not allowed on marketplace agents to prevent unauthorized access.
- **Permission Mode**: This feature is blocked to ensure users do not inadvertently grant excessive permissions to external entities.

### Why Are These Elements Blocked?
Removing these elements minimizes security risks, particularly with publicly available agents. Local agents may still retain these features, depending on their configuration.