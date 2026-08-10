import { loadCredentials } from "./credentials.mjs";

const AGENT_PATH = "/api/cli/proxy/agent";

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
        // separate plugin from CLI traffic; the server may additionally
        // require it (CLI_REQUIRE_CLIENT_HEADER) to turn away out-of-band
        // callers. Not a credential — never treat it as one.
        "x-statistica-client": "plugin",
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
    default:
      return `Statistica agent request failed (HTTP ${status})${suffix}`;
  }
}
