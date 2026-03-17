# Resources Guide

Resources are the visual media and documents that accompany your agent's marketplace listing: screenshots, demo videos, architecture diagrams, PDF guides, etc. They make listings dramatically more compelling.

## File Locations

```
.web42/resources.json        # Metadata describing each resource
.web42/resources/             # The actual resource files
  screenshot-dashboard.png
  demo-recording.mp4
  setup-guide.pdf
```

## `resources.json` Schema

The file is a JSON array of `ResourceMeta` objects:

```json
[
  {
    "file": "screenshot-dashboard.png",
    "title": "Dashboard Overview",
    "description": "The main dashboard showing weekly report generation",
    "type": "image",
    "sort_order": 0
  },
  {
    "file": "demo-recording.mp4",
    "title": "3-Minute Demo",
    "description": "Watch the agent draft a report from CRM data in real time",
    "type": "video",
    "sort_order": 1
  }
]
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | Yes | Filename in `.web42/resources/` |
| `title` | string | Yes | Display title on the marketplace listing |
| `description` | string | No | Optional caption or context |
| `type` | `"image"` \| `"video"` \| `"document"` | Yes | Determines how the marketplace renders it |
| `sort_order` | number | Yes | Display order (0 = first) |

## Resource Types

### Images

Screenshots, diagrams, architecture overviews, result samples.

- **Recommended:** 1200x800 or 1600x900 (16:9 landscape)
- **Formats:** PNG, JPEG, WebP
- **Max size:** 5 MB per file
- **Tips:**
  - Lead with your best screenshot — it appears first in the gallery.
  - Show the agent *in action*, not just a static interface.
  - Annotate screenshots with callouts if key features are not obvious.
  - Dark-mode and light-mode variants both work well.

### Videos

Demo recordings, walkthroughs, setup tutorials.

- **Recommended:** 1–3 minutes for demos, under 60 seconds for teasers
- **Formats:** MP4, WebM
- **Max size:** 50 MB per file (for local storage; consider hosting large videos externally)
- **Tips:**
  - Start with the outcome, not the setup. Show the result in the first 10 seconds.
  - Screen recordings with voiceover convert better than silent ones.
  - For large video files, consider hosting on YouTube/Loom and linking via `demoVideoUrl` in the manifest instead.

### Documents

PDF guides, setup instructions, architecture docs.

- **Formats:** PDF
- **Max size:** 10 MB per file
- **Tips:**
  - Use for detailed setup guides that are too long for the README.
  - A 1-page "quick start" PDF is a nice touch for complex agents.

## How Resources Appear on the Marketplace

Resources are displayed on the agent's detail page:

- **Images** show as a scrollable gallery below the agent header.
- **Videos** embed with a play button.
- **Documents** appear as downloadable links.

The `sort_order` controls the display sequence across all types.

## Sync Behavior

When you run `web42 push`, the CLI:

1. Reads `.web42/resources.json` for metadata.
2. Uploads each file from `.web42/resources/` to the server.
3. Creates the corresponding `agent_resources` rows in the database.

When you run `web42 pull`, the CLI writes `.web42/resources.json` with metadata from the remote. Resource files themselves are not downloaded back (they are referenced by URL in the snapshot).

## Example Workflow

1. Take screenshots of your agent in action.
2. Save them to `.web42/resources/`.
3. Create or update `.web42/resources.json` with metadata for each file.
4. Run `web42 push` — the resources upload alongside everything else.

```json
[
  {
    "file": "slack-report.png",
    "title": "Weekly Report in Slack",
    "description": "Automated report posted to #team-updates every Monday",
    "type": "image",
    "sort_order": 0
  },
  {
    "file": "crm-dashboard.png",
    "title": "CRM Data View",
    "description": "The agent reads from your CRM and extracts key metrics",
    "type": "image",
    "sort_order": 1
  },
  {
    "file": "setup-guide.pdf",
    "title": "Setup Guide",
    "description": "Step-by-step guide for connecting your CRM and Slack",
    "type": "document",
    "sort_order": 2
  }
]
```
