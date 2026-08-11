#!/usr/bin/env node
/**
 * Statistica MCP server (stdio).
 *
 * Exposes a single tool, `ask_statistica`, that delegates a research/analysis
 * task to the Statistica AI agent via the authenticated Statistica API (which
 * signs the user in and meters usage). No backend credentials live in this
 * client; it only forwards the user's own token.
 *
 * Implemented in pure Node stdlib (newline-delimited JSON-RPC 2.0) so the plugin
 * stays dependency-free and runs the moment it is cloned — no `npm install`.
 */
import process from "node:process";
import { askStatistica, PLUGIN_VERSION } from "./lib/agent-client.mjs";

const PROTOCOL_VERSION = "2025-06-18";
// Single source of truth: PLUGIN_VERSION is read from plugin.json by
// agent-client.mjs at module load. Do NOT hardcode a version here — a
// hardcoded value drifts (this one sat at 0.1.0 for four releases). If the
// read fails, fall back to "0.0.0" rather than inventing a plausible-looking
// number.
const SERVER_INFO = {
  name: "statistica-ai",
  version: PLUGIN_VERSION ?? "0.0.0",
};

const ASK_STATISTICA_TOOL = {
  name: "ask_statistica",
  description:
    "Send a question or task to the full Statistica AI agent for deep financial " +
    "research, market/data analysis, and report or data-science workflows. The " +
    "agent runs in the cloud with 150+ tools, skills, and sub-agents, and returns " +
    "its final written answer. Use this for anything requiring multi-step research, " +
    "live market/economic data, SEC filings, or quantitative analysis. Each call " +
    "consumes Statistica credits.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The research question or task to send to Statistica AI.",
      },
      thread_id: {
        type: "string",
        description:
          "Optional. Continue a previous Statistica conversation by passing the " +
          "thread_id returned from an earlier call.",
      },
    },
    required: ["query"],
  },
};

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function respond(id, result) {
  write({ jsonrpc: "2.0", id, result });
}

function respondError(id, code, message) {
  write({ jsonrpc: "2.0", id, error: { code, message } });
}

async function handleToolCall(id, params) {
  const name = params?.name;
  const args = params?.arguments ?? {};

  if (name !== ASK_STATISTICA_TOOL.name) {
    respondError(id, -32602, `Unknown tool: ${name}`);
    return;
  }

  try {
    const { content, threadId } = await askStatistica({
      query: args.query,
      threadId: args.thread_id,
    });
    const header = threadId ? `[thread_id: ${threadId}]\n\n` : "";
    // Tool-level failures are reported in-band (isError), not as JSON-RPC errors,
    // so the host model can read and react to the message.
    respond(id, {
      content: [{ type: "text", text: `${header}${content}` }],
      isError: false,
    });
  } catch (error) {
    respond(id, {
      content: [{ type: "text", text: error.message ?? String(error) }],
      isError: true,
    });
  }
}

function handleMessage(message) {
  const { id, method, params } = message;
  const isRequest = id !== undefined && id !== null;

  switch (method) {
    case "initialize":
      respond(id, {
        protocolVersion: params?.protocolVersion ?? PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });
      return;
    case "notifications/initialized":
      return; // notification — no reply
    case "ping":
      respond(id, {});
      return;
    case "tools/list":
      respond(id, { tools: [ASK_STATISTICA_TOOL] });
      return;
    case "tools/call":
      // Fire-and-forget the async work; it responds with the request id when done.
      void handleToolCall(id, params);
      return;
    default:
      if (isRequest) {
        respondError(id, -32601, `Method not found: ${method}`);
      }
  }
}

function main() {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf("\n");
      if (!line) {
        continue;
      }
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        // Can't recover an id from unparseable input; surface on stderr only.
        process.stderr.write(`statistica-mcp: dropping invalid JSON line\n`);
        continue;
      }
      try {
        handleMessage(message);
      } catch (error) {
        process.stderr.write(`statistica-mcp: handler error: ${error.message}\n`);
      }
    }
  });
  process.stdin.on("end", () => process.exit(0));
}

main();
