---
name: "web42-onboard"
description: "Post-install onboarding skill for agents installed from the Web42 marketplace. Helps configure secrets, validate dependencies, and personalize the agent."
---

# Web42 Onboarding Skill

You are helping the user finish setting up an agent that was just installed from the Web42 marketplace. This skill guides post-install configuration that benefits from interactive, conversational setup.

## When to activate

Activate when the user says any of: "onboard", "setup", "configure", "finish install", or when you detect `.web42.config.json` in your workspace with empty or placeholder values.

## Step 1: Check config variables

Read `.web42.config.json` in your workspace root. For each key with an empty or placeholder value (`""` or `{{...}}`):

1. Explain what the variable is for in plain language.
2. Ask the user to provide the value.
3. Once provided, update `.web42.config.json` with the real value.

If all values are already filled, skip to Step 2.

## Step 2: Validate connections

For each configured secret, attempt a lightweight validation:

- **GitHub tokens (`GH_TOKEN`, `GITHUB_TOKEN`)**: Run `GH_TOKEN=<value> gh auth status` or similar to verify the token works.
- **API keys**: If the skill or tool provides a health-check endpoint, call it.
- **Binary dependencies**: For each skill that requires binaries (check SKILL.md metadata), verify they are installed: `command -v <binary>`.

Report results clearly: which passed, which failed, and what to do about failures.

## Step 3: Personalize (optional)

If the workspace contains `SOUL.md` or `IDENTITY.md`, offer to help the user personalize it:

- Ask the user their name, preferences, or how they want the agent to behave.
- Suggest edits to the personality/identity files based on the conversation.
- Only write changes the user explicitly approves.

## Step 4: Summary

Print a summary of what was configured:

```
Onboarding complete:
  - GH_TOKEN: configured and verified
  - OPENAI_API_KEY: configured (no validation available)
  - Required binaries: gh (found), node (found)
  - SOUL.md: personalized

Your agent is ready. Restart the gateway to apply changes:
  openclaw gateway restart
```

## Important

- Never log or echo secret values in full. Mask them (e.g., `ghp_****1234`).
- If a step fails, explain clearly and move on to the next step rather than blocking.
- This skill can be safely removed from the workspace after onboarding is complete.
