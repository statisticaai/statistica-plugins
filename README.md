# Statistica plugin

Run **Statistica AI** — deep financial research, market and data analysis, and
report/data‑science workflows — from inside **Claude Code** or **Codex**. The
plugin adds an `ask_statistica` tool (and, in Claude Code, a set of
`/statistica-ai:*` commands) that delegate work to the Statistica AI agent and
return its written answer.

It's a thin client: it holds no API keys and talks only to Statistica using your
own account. Usage counts toward your Statistica plan.

## Requirements

- A **Statistica account** with an active subscription ([statistica.ai](https://www.statistica.ai)).
- **Node.js 18+** (already present with Claude Code / Codex).

## Install

**Claude Code**

```bash
/plugin marketplace add statisticaai/statistica-plugins
/plugin install statistica-ai@statistica
```

**Codex**

```bash
/marketplace add https://github.com/statisticaai/statistica-plugins
```

Then install/enable the `statistica-ai` plugin. Both hosts auto‑start the bundled
`statistica-ai` MCP server, which exposes the `ask_statistica` tool.

> Statistica Code already includes the Statistica agent natively, so this plugin
> is mainly for **Claude Code** and **Codex**.

## Log in

```bash
/statistica-ai:login
```

This opens your browser to sign in and stores a token at
`~/.statistica/credentials.json`. If you already use **Statistica Code** on this
machine, you're already logged in — the plugin reuses the same credentials.

Check status anytime with `/statistica-ai:setup`.

## Use it

Once logged in, just ask — the host model can call the `ask_statistica` tool on
its own:

> "Ask Statistica what AAPL is trading at and the key risks into earnings."

Or use the commands (Claude Code):

| Command | What it does |
| --- | --- |
| `/statistica-ai:ask <question>` | Ask Statistica AI and wait for the answer |
| `/statistica-ai:research <question>` | Run a longer research task in the background |
| `/statistica-ai:status [id]` | Show running and recent research jobs |
| `/statistica-ai:result [id]` | Show a finished job's answer |
| `/statistica-ai:cancel [id]` | Stop tracking a running job |
| `/statistica-ai:login` · `/statistica-ai:setup` | Sign in · check status |

Research answers can include a `thread_id` you can pass back to continue the
same conversation.

## How it works

The plugin runs a small local MCP server that forwards your question — with your
own account token — to Statistica. Statistica authenticates you, runs the agent,
and returns the final answer. No backend credentials are stored in this
repository or on your machine beyond your personal login token.

## License

Apache‑2.0. See [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE). The plugin
structure is adapted from OpenAI's `codex-plugin-cc` (Apache‑2.0).
