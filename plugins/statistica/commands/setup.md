---
description: Check whether Statistica is set up and you are logged in
allowed-tools: Bash(node:*)
---

Check Statistica login status.

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/companion.mjs" setup
```

Return the output. If it reports you are not logged in, tell the user to run
`/statistica-ai:login`.
