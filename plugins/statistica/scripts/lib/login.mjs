/**
 * login.mjs — browser-callback PKCE login for the Statistica plugin (Node, zero-dep).
 *
 * Adapted from the Statistica Code CLI login flow (Apache-2.0). Lets a Claude
 * Code / Codex user authenticate without having the Statistica Code CLI
 * installed: it runs the same PKCE code-exchange against the Statistica API
 * and writes ~/.statistica/credentials.json, which the MCP server then reads.
 *
 * Flow:
 *   1. PKCE pair: verifier (random) + challenge (base64url(sha256(verifier)))
 *   2. start http server on 127.0.0.1:<free port>
 *   3. open {server}/auth/cli?state&port&code_challenge&code_challenge_method=S256
 *   4. browser redirects to http://127.0.0.1:<port>/callback?code&state
 *   5. POST {code, code_verifier} to {server}/api/auth/cli/exchange -> {token, user_id, email}
 *   6. save {token,user_id,email,server_url} -> credentials.json (0600)
 *
 * Usage: node login.mjs [--status] [--no-browser] [--server <url>]
 */
import { createServer as httpCreateServer } from "node:http";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, createHash } from "node:crypto";
import { spawn } from "node:child_process";

import { credentialsPath } from "./credentials.mjs";

const DEFAULT_SERVER_URL = "https://www.statistica.ai";
const ALLOWED_HOSTS = new Set([
  "statistica.ai",
  "www.statistica.ai",
  "localhost",
  "127.0.0.1",
]);
const TIMEOUT_MS = 300_000;

/** Permissible Statistica server URL: https everywhere, http only for localhost. */
function isValidServerUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const { protocol, hostname } = parsed;
  if (protocol !== "https:" && protocol !== "http:") return false;
  if (protocol === "http:" && hostname !== "localhost" && hostname !== "127.0.0.1")
    return false;
  return ALLOWED_HOSTS.has(hostname);
}

function generatePkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function buildAuthUrl(server, state, port, challenge) {
  return `${server.replace(/\/+$/, "")}/auth/cli?state=${state}&port=${port}&code_challenge=${challenge}&code_challenge_method=S256`;
}

function exchangeCode(server, code, verifier) {
  return new Promise((resolve, reject) => {
    const base = server.replace(/\/+$/, "");
    const url = new URL(`${base}/api/auth/cli/exchange`);
    const body = JSON.stringify({ code, code_verifier: verifier });
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const reqFn = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = reqFn(options, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return reject(new Error(`Exchange response not valid JSON: ${raw}`));
        }
        if (res.statusCode === 200) {
          const { token, user_id, email } = parsed;
          if (!token || !user_id) {
            return reject(new Error("Exchange response missing token or user_id"));
          }
          return resolve({ token, user_id, email: email || "" });
        }
        const errField = parsed.error || `HTTP ${res.statusCode}`;
        return reject(new Error(`Code exchange failed: ${errField}`));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function saveCredentials(data, p = credentialsPath()) {
  const dir = dirname(p);
  mkdirSync(dir, { recursive: true });
  try {
    chmodSync(dir, 0o700);
  } catch {
    // best-effort
  }
  const json = JSON.stringify(
    {
      token: data.token,
      user_id: data.user_id,
      email: data.email,
      server_url: data.server_url,
    },
    null,
    2,
  );
  writeFileSync(p, json, { mode: 0o600 });
  try {
    chmodSync(p, 0o600);
  } catch {
    // best-effort
  }
}

function printStatus(p = credentialsPath()) {
  if (!existsSync(p)) {
    console.log("Not logged in.");
    return 1;
  }
  let d;
  try {
    d = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    console.log("Not logged in (credentials unreadable).");
    return 1;
  }
  const tok = d.token || "";
  const ok = tok.startsWith("ctk_");
  console.log(`Logged in as ${d.email || "?"} (${d.server_url || "?"})`);
  console.log(`token: ${tok ? "present" : "missing"} (valid prefix: ${ok})`);
  return ok ? 0 : 1;
}

function openBrowser(url) {
  let cmd, args;
  switch (process.platform) {
    case "darwin":
      cmd = "open";
      args = [url];
      break;
    case "win32":
      cmd = "cmd";
      args = ["/c", "start", '""', url];
      break;
    default:
      cmd = "xdg-open";
      args = [url];
  }
  try {
    const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    child.unref();
  } catch {
    // silently ignore
  }
}

async function runLogin({ server = DEFAULT_SERVER_URL, openBrowser: doOpen = true } = {}) {
  if (!isValidServerUrl(server)) {
    console.error(`Refusing to use disallowed server URL: ${server}`);
    return 2;
  }

  const state = randomBytes(16).toString("hex");
  const { verifier, challenge } = generatePkce();

  const callbackResult = await new Promise((resolve) => {
    const httpServer = httpCreateServer();
    const settle = makeCloseAndResolve(httpServer, resolve);

    httpServer.on("request", (req, res) => {
      const reqUrl = new URL(req.url, "http://127.0.0.1");
      if (reqUrl.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }
      const params = reqUrl.searchParams;
      if (params.has("error")) {
        sendHtml(res, "Authorization denied. You can close this tab.");
        settle({ error: params.get("error") });
        return;
      }
      if (params.get("state") !== state) {
        sendHtml(res, "Authorization failed: state mismatch.");
        settle({ error: "State mismatch" });
        return;
      }
      const code = params.get("code");
      if (!code) {
        sendHtml(res, "Authorization failed: missing code.");
        settle({ error: "Missing code" });
        return;
      }
      sendHtml(
        res,
        "Authorization successful! You can close this tab and return to your terminal.",
      );
      settle({ code });
    });

    httpServer.listen(0, "127.0.0.1", () => {
      const { port } = httpServer.address();
      const authUrl = buildAuthUrl(server, state, port, challenge);
      console.log("Opening browser to authenticate...");
      console.log(`If the browser doesn't open, visit:\n  ${authUrl}`);
      if (doOpen) {
        openBrowser(authUrl);
      }
      const timer = setTimeout(() => {
        settle({ error: "timeout" });
      }, TIMEOUT_MS);
      timer.unref();
    });
  });

  if (!callbackResult || callbackResult.error) {
    if (callbackResult && callbackResult.error === "timeout") {
      console.error("Login timed out. Please try again.");
    } else {
      console.error(`Login failed: ${(callbackResult || {}).error || "Unknown error"}`);
    }
    return 1;
  }

  let exchanged;
  try {
    exchanged = await exchangeCode(server, callbackResult.code, verifier);
  } catch (err) {
    console.error(`Login failed: ${err.message}`);
    return 1;
  }

  saveCredentials({
    token: exchanged.token,
    user_id: exchanged.user_id,
    email: exchanged.email,
    server_url: server,
  });
  console.log(`Logged in as ${exchanged.email}`);
  return 0;
}

function sendHtml(res, message) {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const body = `<html><body><h2>${escaped}</h2></body></html>`;
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(body);
}

function makeCloseAndResolve(httpServer, resolve) {
  let called = false;
  return (value) => {
    if (called) return;
    called = true;
    setImmediate(() => {
      httpServer.close();
      resolve(value);
    });
  };
}

async function main(argv = process.argv.slice(2)) {
  let server = DEFAULT_SERVER_URL;
  let status = false;
  let noBrowser = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--status") status = true;
    else if (arg === "--no-browser") noBrowser = true;
    else if (arg === "--server") server = argv[++i];
    else if (arg.startsWith("--server=")) server = arg.slice("--server=".length);
  }
  if (status) return printStatus();
  return runLogin({ server, openBrowser: !noBrowser });
}

// Run only when invoked directly (`node login.mjs ...`), not when imported.
const invokedDirectly = (() => {
  try {
    return fileURLToPath(import.meta.url) === process.argv[1];
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err?.message ?? String(err));
      process.exit(1);
    });
}

export { isValidServerUrl, runLogin, printStatus, saveCredentials, main };
