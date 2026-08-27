// Set once per request via middleware in index.ts, read by layout.ts to render the
// version footer. Safe as a module-level variable despite the shared Worker isolate:
// the value is identical for every request to a given deployment, so there's no
// cross-request contamination risk even under concurrent/interleaved execution.
let commitSha = 'dev';

export function setCommitSha(sha: string): void {
  commitSha = sha;
}

export function getCommitSha(): string {
  return commitSha;
}
