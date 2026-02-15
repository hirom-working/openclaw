import { randomUUID } from "node:crypto";

type MediaEntry = { buffer: Buffer; contentType: string; expiresAt: number };
const store = new Map<string, MediaEntry>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function storeMedia(buffer: Buffer, contentType: string, ttlMs = DEFAULT_TTL_MS): string {
  const id = randomUUID();
  store.set(id, { buffer, contentType, expiresAt: Date.now() + ttlMs });
  return id;
}

export function getMedia(id: string): { buffer: Buffer; contentType: string } | null {
  const entry = store.get(id);
  if (!entry || entry.expiresAt < Date.now()) {
    store.delete(id);
    return null;
  }
  return { buffer: entry.buffer, contentType: entry.contentType };
}

export function startMediaCleanup(intervalMs = 60_000): NodeJS.Timeout {
  return setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of store) {
      if (entry.expiresAt < now) store.delete(id);
    }
  }, intervalMs);
}

// Auto-start cleanup on module load (unref so it doesn't keep the process alive)
startMediaCleanup().unref();
