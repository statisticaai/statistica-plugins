---
description: Run a longer Statistica AI research task in the background
argument-hint: "<question>"
allowed-tools: Bash(node:*)
---

Start a **background** Statistica research job. Research runs can take several
minutes, so this does not block.

Launch it in the background (do not wait for it in this turn):

```typescript
Bash({
  command: `node "${CLAUDE_PLUGIN_ROOT}/scripts/companion.mjs" research "$ARGUMENTS"`,
  description: "Statistica research",
  run_in_background: true,
});
```

After launching, tell the user: "Started a Statistica research job in the
background — check progress with `/statistica-ai:status` and read the result with
`/statistica-ai:result`." Do not call BashOutput or wait for completion.
