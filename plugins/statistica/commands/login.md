---
description: Log in to Statistica (opens your browser)
allowed-tools: Bash(node:*)
---

Authenticate to Statistica. This opens your browser to sign in and stores a
token at `~/.statistica/credentials.json`, which the Statistica MCP server and
commands use.

Run (foreground — it waits for you to finish in the browser):

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/login.mjs"
```

Return the output. When it prints "Logged in as …", confirm success and let the
user know they can now use `/statistica-ai:ask` and the `ask_statistica` tool.
If you are already signed in to Statistica Code on this machine, you are
already logged in and can skip this.
