// Escape a user-supplied string so it can be safely used as a literal inside
// a MongoDB `$regex` query. This prevents regex-injection and ReDoS (catastrophic
// backtracking) from untrusted search input while preserving substring matching.
export function escapeRegExp(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
