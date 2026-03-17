# Marketplace Configuration Reference

The file `.web42/marketplace.json` controls how your agent appears and is sold on the Web42 marketplace. It is created automatically by `web42 init` with sensible defaults.

## File Location

```
.web42/marketplace.json
```

## Fields

### `price_cents` (number)

The price in cents. `0` means free.

- **Default:** `0`
- **Examples:** `0` (free), `500` ($5.00), `2999` ($29.99), `10000` ($100.00)
- **Guidance:**
  - Free agents get more installs but less revenue. Consider free for simple utilities, paid for specialized workflows.
  - Look at comparable agents on the marketplace for pricing cues.
  - $5–$15 is a sweet spot for productivity agents. $20–$50 for specialized professional tools.
  - You can always start free and add pricing later.

### `currency` (string)

ISO 4217 currency code.

- **Default:** `"usd"`
- **Values:** Currently only `"usd"` is supported.

### `license` (string | null)

The license under which the agent is distributed. `null` means no license specified.

- **Default:** `null`
- **Supported values:**

| License | Summary | Best For |
|---------|---------|----------|
| `"MIT"` | Permissive. Buyers can do almost anything. | Open tools, community agents |
| `"Apache-2.0"` | Permissive + patent grant. | Enterprise-friendly tools |
| `"GPL-3.0"` | Copyleft. Derivatives must also be GPL. | Agents you want to stay open |
| `"BSD-3-Clause"` | Permissive, similar to MIT. | Academic or research agents |
| `"Proprietary"` | All rights reserved. No redistribution. | Commercial/paid agents |
| `"Custom"` | Custom terms defined elsewhere. | Unique licensing needs |

- **Guidance:**
  - For **free agents** intended as community contributions: `MIT` or `Apache-2.0`.
  - For **paid agents**: `Proprietary` is the standard choice — buyers get usage rights but cannot redistribute.
  - If unsure, `MIT` for free and `Proprietary` for paid is a safe default.

### `tags` (string array)

Searchable labels for marketplace discoverability. These are the canonical tags shown on the marketplace listing.

- **Default:** `[]`
- **Constraints:** Each tag should be lowercase, hyphenated for multi-word.
- **Good:** `["crm", "slack-integration", "weekly-reports", "productivity"]`
- **Bad:** `["ai", "agent", "good", "cool"]` (too generic)
- **Guidance:**
  - Use 3–6 tags.
  - Mix **category terms** ("finance", "devops", "support") with **capability terms** ("pdf-generation", "slack-integration", "email-monitoring").
  - Think about what a buyer would search for to find your agent.
  - Tags also appear in the manifest — the marketplace.json tags are the canonical source that gets synced to the remote.

## Visibility (Dashboard Only)

Agent visibility is **not** controlled through local files. It is managed exclusively through the Web42 dashboard at `web42.ai`.

The visibility lifecycle:

1. **`private`** (default) — Only you can see it. Use this while developing and preparing.
2. **`unlisted`** — Accessible via direct link but not in search/browse. Good for beta testers or early feedback.
3. **`public`** — Visible to everyone on the marketplace. Set this when you're ready to launch.

Remind the user to visit the dashboard to toggle visibility when the agent is ready.

## Example File

```json
{
  "price_cents": 999,
  "currency": "usd",
  "license": "Proprietary",
  "tags": [
    "crm",
    "slack-integration",
    "weekly-reports",
    "productivity"
  ]
}
```

## Sync Behavior

When you run `web42 push`, the contents of `.web42/marketplace.json` are included in the sync snapshot and written to the remote database. When you run `web42 pull`, remote marketplace settings (except visibility) are written back to this file.

Changes made on the dashboard (e.g., editing tags or price via the web UI) will be reflected locally on the next `web42 pull`.
