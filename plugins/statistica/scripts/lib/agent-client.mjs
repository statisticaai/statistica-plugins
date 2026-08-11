import { loadCredentials } from "./credentials.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AGENT_PATH = "/api/cli/proxy/agent";

/**
 * This plugin's version, read from plugin.json — the single source of truth
 * the marketplace also publishes. Read rather than hardcoded so the two can
 * never drift apart.
 *
 * Sent as `x-statistica-client-version` so the server can enforce a minimum
 * version without another breaking change. If the read fails we send no
 * version header, which the server treats as unverifiable (and therefore
 * rejects once a minimum is configured) — the safe direction.
 */
const PLUGIN_VERSION = readPluginVersion();

function readPluginVersion() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const manifest = join(here, "..", "..", ".claude-plugin", "plugin.json");
    const parsed = JSON.parse(readFileSync(manifest, "utf8"));
    return typeof parsed?.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

/**
 * @typedef {Object} AskResult
 * @property {string} content   Final assistant text from the Statistica agent.
 * @property {string|null} threadId  Conversation thread id (for follow-ups).
 * @property {string|null} runId     Run id (for tracking).
 */

/**
 * Invoke the Statistica AI agent through the authenticated Statistica API.
 * The user's token is sent to their configured Statistica server, which runs
 * the agent and returns its final answer. No backend credentials live here.
 *
 * @param {Object} opts
 * @param {string} opts.query          The research question / task.
 * @param {string} [opts.threadId]     Continue an existing thread.
 * @param {AbortSignal} [opts.signal]  Optional cancellation signal.
 * @returns {Promise<AskResult>}
 */
export async function askStatistica({ query, threadId, signal } = {}) {
  if (!query || !query.trim()) {
    throw new Error("Query must not be empty.");
  }

  const { token, serverUrl } = loadCredentials();
  assertSecureServerUrl(serverUrl);
  const url = `${serverUrl.replace(/\/+$/, "")}${AGENT_PATH}`;

  const body = { query };
  if (threadId) {
    body.thread_id = threadId;
  }

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        // Identifies this as the first-party plugin. Analytics use this to
        // separate plugin from CLI traffic; the server also requires it and
        // rejects unidentified callers with 426. Not a credential — never
        // treat it as one.
        "x-statistica-client": "plugin",
        ...(PLUGIN_VERSION
          ? { "x-statistica-client-version": PLUGIN_VERSION }
          : {}),
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }
    throw new Error(`Could not reach Statistica (${url}): ${error.message}`);
  }

  if (!response.ok) {
    const detail = await safeErrorMessage(response);
    throw new Error(httpErrorMessage(response.status, detail));
  }

  const data = await response.json();
  return {
    content: data.content ?? "",
    threadId: data.thread_id ?? null,
    runId: data.run_id ?? null,
  };
}

/**
 * Never transmit the bearer `ctk_` token over an unencrypted connection. HTTPS
 * is required; plain `http` is permitted only for local development hosts.
 */
function assertSecureServerUrl(serverUrl) {
  let parsed;
  try {
    parsed = new URL(serverUrl);
  } catch {
    throw new Error(`Invalid server_url in credentials: ${serverUrl}`);
  }
  const isLocalhost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "::1";
  if (parsed.protocol !== "https:" && !isLocalhost) {
    throw new Error(
      `Refusing to send credentials to ${parsed.origin} over an insecure (non-HTTPS) connection.`,
    );
  }
}

async function safeErrorMessage(response) {
  try {
    const data = await response.json();
    return data?.error ?? data?.message ?? null;
  } catch {
    return null;
  }
}

function httpErrorMessage(status, detail) {
  const suffix = detail ? `: ${detail}` : "";
  switch (status) {
    case 401:
      return "Authentication failed — your login may have expired. Run `/statistica-ai:login`.";
    case 402:
      return "Out of credits. Top up your Statistica plan to continue.";
    case 403:
      return "An active Statistica subscription is required.";
    case 426:
      return (
        detail ??
        "Your Statistica plugin is out of date. Update it with: `/plugin update statistica-ai`"
      );
    default:
      return `Statistica agent request failed (HTTP ${status})${suffix}`;
  }
}
