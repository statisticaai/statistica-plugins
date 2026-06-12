---
description: Show the result of a finished Statistica research job
argument-hint: "[job-id]"
allowed-tools: Bash(node:*)
---

Show the stored output of a finished Statistica job (the latest one if no id is
given).

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/companion.mjs" result "$ARGUMENTS"
```

Return the output verbatim. If the job is still running, tell the user to check
`/statistica-ai:status`.
