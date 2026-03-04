// Simple in-memory job store for local development without a database.
// Data is reset whenever the dev server restarts.

let jobs = [];
let nextId = 1;

export function createJob(job) {
  const now = new Date().toISOString();
  const withDefaults = {
    id: nextId++,
    createdAt: now,
    updatedAt: now,
    ...job,
  };
  jobs.push(withDefaults);
  return withDefaults;
}

export function listJobs() {
  // Return newest first, similar to ORDER BY createdAt DESC
  return [...jobs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

