import type { StorefrontCacheEntry } from "../types";

export class StorefrontMemoryCache {
  private readonly entries = new Map<string, StorefrontCacheEntry<unknown>>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  get<T>(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): T {
    this.entries.set(key, { value, expiresAt: this.now() + Math.max(0, ttlMs) });
    return value;
  }

  invalidate(prefix?: string) {
    if (!prefix) {
      this.entries.clear();
      return;
    }
    Array.from(this.entries.keys()).forEach((key) => {
      if (key.startsWith(prefix)) this.entries.delete(key);
    });
  }
}
