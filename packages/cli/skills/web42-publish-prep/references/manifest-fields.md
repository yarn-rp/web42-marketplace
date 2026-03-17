# manifest.json Field Reference

The manifest describes your agent package. Format version is always `"agentpkg/1"`.

## Required Fields

### `name` (string)

The package identifier. Appears in install commands and URLs.

- **Constraints:** 1–100 characters. Lowercase alphanumeric with hyphens only. Must start with a letter or number. Regex: `^[a-z0-9][a-z0-9-]*$`
- **Good:** `support-bot`, `code-reviewer`, `daily-digest`
- **Bad:** `My_Agent`, `Support Bot`, `-agent`
- **Guidance:** Pick something short, memorable, and descriptive of what the agent does. This becomes the slug in `@author/name`.

### `description` (string)

A short pitch for the agent. Shown in search results and the marketplace listing.

- **Constraints:** 1–500 characters.
- **Good:** "Drafts weekly team reports from your CRM data and posts them to Slack every Monday."
- **Bad:** "An AI agent." / "This agent uses GPT-4 to process natural language queries against a database."
- **Guidance:** Lead with the benefit to the user. What problem disappears? Avoid technical jargon about how it works internally.

### `version` (string)

Semantic version of the package.

- **Constraints:** Must match `MAJOR.MINOR.PATCH` (e.g., `1.0.0`).
- **Guidance:** Start at `1.0.0` for first publish. Bump `PATCH` for fixes, `MINOR` for new capabilities, `MAJOR` for breaking changes to config or behavior.

### `author` (string)

Your Web42 username. Set automatically by `web42 init` from your auth credentials.

- **Constraints:** Non-empty string.
- **Guidance:** Don't edit manually — it's populated from `web42 auth whoami`.

## Optional Fields

### `platform` (string)

Target agent platform.

- **Values:** Currently only `"openclaw"`.
- **Guidance:** Set during `web42 init` based on the platform prompt.

### `skills` (array)

List of skills the agent provides. Each entry has `name` (string) and `description` (string).

- **Auto-detected** from `skills/*/SKILL.md` during init and pack.
- **Guidance:** Don't edit manually. Add skills by creating `skills/<name>/SKILL.md` in your workspace. Internal skills (with `internal: true` in frontmatter) are automatically excluded.

### `plugins` (string array)

Reserved for future use.

- **Default:** `[]`
- **Guidance:** Leave empty for now.

### `modelPreferences` (object)

Preferred LLM models for this agent.

- **Fields:** `primary` (string, optional), `fallback` (string, optional)
- **Example:** `{ "primary": "claude-sonnet-4-20250514" }`
- **Guidance:** Set `primary` to the model the agent is designed and tested for. The `fallback` is used if the primary is unavailable. During install, the CLI will prompt buyers for the corresponding provider API key.

### `tags` (string array)

Searchable labels for marketplace discoverability.

- **Default:** `[]`
- **Good:** `["support", "crm", "slack", "weekly-reports"]`
- **Bad:** `["ai", "agent", "good"]` (too generic)
- **Guidance:** 3–6 tags. Think about what a buyer would search for. Mix category terms ("support", "finance") with capability terms ("slack-integration", "pdf-generation").

### `coverImage` (string)

Path to a cover image file, relative to workspace root.

- **Guidance:** Optional but recommended. A good cover image dramatically improves click-through on the marketplace. Use a 1200x630 or 1200x1200 image.

### `demoVideoUrl` (string)

URL to a demo video.

- **Constraints:** Must be a valid URL.
- **Guidance:** A 1–3 minute video showing the agent in action converts far better than text alone. Host on YouTube, Loom, or similar.

### `configVariables` (array)

Secrets and configuration values that buyers provide during install.

- **Each entry:** `{ key, label, description?, required, default? }`
  - `key` — Environment variable name (e.g., `SLACK_BOT_TOKEN`)
  - `label` — Human-readable name shown in the install prompt (e.g., "Slack Bot Token")
  - `description` — Optional help text explaining where to find this value
  - `required` — Whether install should block without it
  - `default` — Optional default value
- **Auto-detected** from skill files during pack (secrets are stripped and replaced with placeholders).
- **Guidance:** For each config variable, make the `label` and `description` crystal clear. A buyer who has never seen your agent should understand exactly what to provide and where to get it.

## Example Manifest

```json
{
  "format": "agentpkg/1",
  "platform": "openclaw",
  "name": "weekly-digest",
  "description": "Summarizes your team's CRM activity and posts a digest to Slack every Monday morning.",
  "version": "1.0.0",
  "author": "alice",
  "skills": [
    { "name": "crm-reader", "description": "Query CRM data for weekly activity" },
    { "name": "slack-poster", "description": "Post formatted messages to Slack channels" }
  ],
  "plugins": [],
  "modelPreferences": { "primary": "claude-sonnet-4-20250514" },
  "tags": ["crm", "slack", "weekly-reports", "productivity"],
  "coverImage": "assets/cover.png",
  "demoVideoUrl": "https://www.youtube.com/watch?v=example",
  "configVariables": [
    {
      "key": "CRM_API_KEY",
      "label": "CRM API Key",
      "description": "Found in your CRM dashboard under Settings > API",
      "required": true
    },
    {
      "key": "SLACK_BOT_TOKEN",
      "label": "Slack Bot Token",
      "description": "Create a Slack app at api.slack.com and copy the Bot User OAuth Token",
      "required": true
    }
  ]
}
```
