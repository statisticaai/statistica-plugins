#!/usr/bin/env node
/**
 * companion.mjs — CLI behind the Statistica slash commands (Claude Code).
 *
 * Subcommands: ask | research | status | result | cancel | setup
 * All agent work goes through the authenticated Statistica API; this process
 * holds no secrets beyond the user's own token.
 */
import process from "node:process";

import { askStatistica } from "./lib/agent-client.mjs";
import {
  newJobId,
  recordJob,
  updateJob,
  getJob,
  listJobs,
  latestJob,
} from "./lib/jobs.mjs";
import { printStatus } from "./lib/login.mjs";

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function cmdAsk(args) {
  const query = args.join(" ").trim();
  if (!query) fail("Usage: ask <query>");
  try {
    const { content, threadId } = await askStatistica({ query });
    if (threadId) console.log(`[thread_id: ${threadId}]\n`);
    console.log(content);
  } catch (error) {
    fail(error.message);
  }
}

async function cmdResearch(args) {
  const query = args.join(" ").trim();
  if (!query) fail("Usage: research <query>");
  const id = newJobId();
  recordJob({
    id,
    query,
    status: "running",
    cwd: process.cwd(),
    startedAt: Date.now(),
    finishedAt: null,
    threadId: null,
    runId: null,
    content: "",
    error: null,
  });
  console.log(
    `Started Statistica research job ${id}. Track it with /statistica-ai:status and read it with /statistica-ai:result.`,
  );
  try {
    const { content, threadId, runId } = await askStatistica({ query });
    // Don't clobber a cancellation that happened while we were running.
    if (getJob(id)?.status === "cancelled") {
      console.log(`Job ${id} was cancelled; discarding result.`);
      return;
    }
    updateJob(id, {
      status: "done",
      content,
      threadId,
      runId,
      finishedAt: Date.now(),
    });
    console.log(`Job ${id} complete.`);
  } catch (error) {
    updateJob(id, { status: "error", error: error.message, finishedAt: Date.now() });
    fail(`Job ${id} failed: ${error.message}`);
  }
}

function formatJob(job) {
  const elapsedMs = (job.finishedAt || Date.now()) - (job.startedAt || Date.now());
  const elapsed = `${Math.max(0, Math.round(elapsedMs / 1000))}s`;
  const trailing = job.status === "running" ? "…" : "";
  const snippet = job.query.length > 60 ? `${job.query.slice(0, 57)}...` : job.query;
  return `${job.id}  [${job.status}${trailing}]  ${elapsed}  ${snippet}`;
}

function cmdStatus(args) {
  const id = args[0];
  if (id) {
    const job = getJob(id);
    if (!job) fail(`No job ${id}.`);
    console.log(formatJob(job));
    return;
  }
  const jobs = listJobs(process.cwd());
  if (!jobs.length) {
    console.log("No Statistica jobs for this directory yet.");
    return;
  }
  for (const job of jobs.slice(0, 10)) console.log(formatJob(job));
}

function cmdResult(args) {
  const id = args[0];
  const job = id ? getJob(id) : latestJob(process.cwd());
  if (!job) fail(id ? `No job ${id}.` : "No Statistica jobs yet.");
  switch (job.status) {
    case "running":
      console.log(`Job ${job.id} is still running. Check /statistica-ai:status.`);
      return;
    case "error":
      console.log(`Job ${job.id} failed: ${job.error}`);
      return;
    case "cancelled":
      console.log(`Job ${job.id} was cancelled.`);
      return;
    default:
      if (job.threadId) console.log(`[thread_id: ${job.threadId}]\n`);
      console.log(job.content || "(no output)");
  }
}

function cmdCancel(args) {
  const id = args[0];
  const job = id ? getJob(id) : latestJob(process.cwd());
  if (!job) fail(id ? `No job ${id}.` : "No Statistica jobs yet.");
  if (job.status !== "running") {
    console.log(`Job ${job.id} is already ${job.status}.`);
    return;
  }
  updateJob(job.id, { status: "cancelled", finishedAt: Date.now() });
  console.log(
    `Stopped tracking job ${job.id}. Note: a run already in progress may finish server-side (you were only charged once, up front).`,
  );
}

async function main() {
  const [sub, ...rest] = process.argv.slice(2);
  switch (sub) {
    case "ask":
      return cmdAsk(rest);
    case "research":
      return cmdResearch(rest);
    case "status":
      return cmdStatus(rest);
    case "result":
      return cmdResult(rest);
    case "cancel":
      return cmdCancel(rest);
    case "setup":
      process.exit(printStatus());
      break;
    default:
      fail(
        `Unknown command: ${sub ?? "(none)"}. Use ask | research | status | result | cancel | setup.`,
      );
  }
}

main();
