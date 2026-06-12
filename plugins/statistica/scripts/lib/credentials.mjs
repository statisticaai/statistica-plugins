import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Resolve the Statistica credentials file. Mirrors the Statistica Code CLI so a
 * single `statistica-code login` (or the plugin's own `/statistica-ai:login`)
 * authenticates every surface.
 */
export function credentialsPath() {
  return (
    process.env.STATISTICA_CREDENTIALS ||
    join(homedir(), ".statistica", "credentials.json")
  );
}

/**
 * Load `{ token, server_url }`. Throws a user-actionable error when the user is
 * not logged in or the file is malformed.
 */
export function loadCredentials(p = credentialsPath()) {
  let raw;
  try {
    raw = readFileSync(p, "utf8");
  } catch {
    throw new Error(
      `Not logged in: ${p} not found. Run \`/statistica-ai:login\` (or \`statistica-code login\`).`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Malformed credentials at ${p}: ${error.message}`);
  }

  if (!parsed.token || !parsed.server_url) {
    throw new Error("Credentials missing token/server_url. Re-run login.");
  }
  return { token: parsed.token, serverUrl: parsed.server_url };
}
