---
description: Ask Statistica AI a research or analysis question (waits for the answer)
argument-hint: "<question>"
allowed-tools: Bash(node:*)
---

Send the user's question to the Statistica AI agent and return its answer.

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/companion.mjs" ask "$ARGUMENTS"
```

- Return the command's output **verbatim** — do not summarize, paraphrase, or add commentary.
- A research answer can take a while; this waits for it. For long tasks, suggest `/statistica-ai:research` (background) instead.
- If the output says "Not logged in", tell the user to run `/statistica-ai:login`.
