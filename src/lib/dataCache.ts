class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private isClient = typeof window !== 'undefined';

  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) {
    if (!this.isClient) return;
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get(key: string) {
    if (!this.isClient) return null;
    const item = this.cache.get(key);
    if (!item || Date.now() - item.timestamp > item.ttl) {
      if (item) this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear() {
    if (this.isClient) {
      this.cache.clear();
    }
  }
}

export const dataCache = new DataCache();
