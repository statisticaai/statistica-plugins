import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Tiny local job store for background Statistica research runs. Lives alongside
 * the credentials so it is per-user and host-agnostic. Each job records the
 * thread/run ids so a finished run can be reopened with the agent.
 */
function jobsPath() {
  return (
    process.env.STATISTICA_PLUGIN_JOBS ||
    join(homedir(), ".statistica", "plugin-jobs.json")
  );
}

function loadAll() {
  const p = jobsPath();
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

function saveAll(jobs) {
  const p = jobsPath();
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, `${JSON.stringify(jobs, null, 2)}\n`);
}

export function newJobId() {
  return `job_${Date.now()}_${randomBytes(3).toString("hex")}`;
}

export function recordJob(job) {
  const jobs = loadAll();
  jobs[job.id] = job;
  saveAll(jobs);
  return job;
}

export function updateJob(id, patch) {
  const jobs = loadAll();
  if (!jobs[id]) return null;
  jobs[id] = { ...jobs[id], ...patch };
  saveAll(jobs);
  return jobs[id];
}

export function getJob(id) {
  return loadAll()[id] ?? null;
}

export function listJobs(cwd) {
  const all = Object.values(loadAll());
  const scoped = cwd ? all.filter((j) => j.cwd === cwd) : all;
  return scoped.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
}

export function latestJob(cwd) {
  return listJobs(cwd)[0] ?? null;
}
