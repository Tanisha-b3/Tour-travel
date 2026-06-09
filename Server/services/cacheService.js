const DEFAULT_TTL_MS = 60 * 1000;
const MAX_ENTRIES = 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const store = new Map();
const stats = { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 };

function sweep() {
  const now = Date.now();
  let removed = 0;
  for (const [key, entry] of store) {
    if (entry.expiresAt > 0 && entry.expiresAt <= now) {
      store.delete(key);
      removed++;
    }
  }
  if (removed) stats.evictions += removed;
  if (store.size > MAX_ENTRIES) {
    const overflow = store.size - MAX_ENTRIES;
    let i = 0;
    for (const key of store.keys()) {
      if (i++ >= overflow) break;
      store.delete(key);
      stats.evictions++;
    }
  }
}

let sweepTimer = null;
function ensureSweepTimer() {
  if (sweepTimer) return;
  sweepTimer = setInterval(sweep, SWEEP_INTERVAL_MS);
  if (typeof sweepTimer.unref === "function") sweepTimer.unref();
}

export function get(key) {
  ensureSweepTimer();
  const entry = store.get(key);
  if (!entry) {
    stats.misses++;
    return undefined;
  }
  if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) {
    store.delete(key);
    stats.evictions++;
    stats.misses++;
    return undefined;
  }
  store.delete(key);
  store.set(key, entry);
  stats.hits++;
  return entry.value;
}

export function set(key, value, ttlMs = DEFAULT_TTL_MS) {
  ensureSweepTimer();
  if (value === undefined) return;
  const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
  if (store.has(key)) store.delete(key);
  else if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) {
      store.delete(oldest);
      stats.evictions++;
    }
  }
  store.set(key, { value, expiresAt, storedAt: Date.now() });
  stats.sets++;
}

export async function wrap(key, loader, ttlMs = DEFAULT_TTL_MS) {
  const cached = get(key);
  if (cached !== undefined) return cached;
  const fresh = await loader();
  if (fresh !== undefined) set(key, fresh, ttlMs);
  return fresh;
}

export function del(key) {
  if (store.delete(key)) stats.deletes++;
}

export function invalidateMatching(matcher) {
  let removed = 0;
  for (const key of Array.from(store.keys())) {
    if (matcher(key)) {
      store.delete(key);
      removed++;
    }
  }
  if (removed) stats.deletes += removed;
  return removed;
}

export function clear() {
  const size = store.size;
  store.clear();
  stats.deletes += size;
  return size;
}

export function snapshot() {
  const now = Date.now();
  const items = [];
  for (const [key, entry] of store) {
    items.push({
      key,
      ttlMs: Math.max(0, entry.expiresAt - now),
      ageMs: now - entry.storedAt,
      size: approxSize(entry.value),
    });
  }
  return { size: store.size, max: MAX_ENTRIES, stats: { ...stats }, items };
}

function approxSize(value) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

export function buildKey(scope, params) {
  if (params === undefined || params === null) return scope;
  if (typeof params === "string" || typeof params === "number") return `${scope}:${params}`;
  return `${scope}:${stableStringify(params)}`;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

export default { get, set, wrap, del, invalidateMatching, clear, snapshot, buildKey };
