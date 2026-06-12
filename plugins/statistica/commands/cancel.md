---
description: Stop tracking a running Statistica research job
argument-hint: "[job-id]"
allowed-tools: Bash(node:*)
---

Cancel tracking of a running Statistica job (the latest one if no id is given).

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/companion.mjs" cancel "$ARGUMENTS"
```

Return the output verbatim.
