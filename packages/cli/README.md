# @web42/cli

CLI for the Web42 Agent Marketplace - push, install, and remix OpenClaw agent packages.

## Installation

To install the CLI globally, run:

```
npm install -g @web42/cli
```

## Authentication

Authenticate with the marketplace by running:

```
web42 login
```

## Supported Platforms

| Platform  | Status       |
|-----------|--------------|
| openclaw  | Fully Supported  |
| claude    | Fully Supported  |

## CLI Commands Reference

### General Commands

| Command      | Description                             |
|--------------|-----------------------------------------|
| `web42 install <agent>` | Install an agent package from the marketplace |
| `web42 push` | Push your agent package to the marketplace |
| `web42 pull` | Pull the latest agent state from the marketplace |
| `web42 list` | List installed agents                   |
| `web42 update <agent>` | Update an installed agent to the latest version |
| `web42 uninstall <agent>` | Uninstall an agent                   |
| `web42 search <query>` | Search the marketplace for agents      |
| `web42 remix <agent>` | Remix an agent package to your account |
| `web42 sync` | Check sync status between local workspace and the marketplace |

### Claude-Specific Examples

- **Initialize a Project:**
  ```
  web42 init
  ```

- **Pack an Agent:**
  ```
  web42 pack --agent <name>
  ```

- **Push an Agent:**
  ```
  web42 push --agent <name>
  ```

- **Install an Agent Globally:**
  ```
  web42 claude install @user/agent
  ```

- **Install an Agent Locally:**
  ```
  web42 claude install -g @user/agent
  ```

## Versioning

Version `0.2.0` introduces Claude Code support.