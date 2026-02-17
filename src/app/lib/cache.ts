/**
 * Simple in-memory cache utility for database results
 */

type CacheEntry<T> = {
    data: T;
    expiry: number;
};

class SimpleCache {
    private cache = new Map<string, CacheEntry<any>>();
    private defaultTtl = 5 * 60 * 1000; // 5 minutes default

    /**
     * Get data from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set data in cache
     */
    set<T>(key: string, data: T, ttl = this.defaultTtl): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl
        });
    }

    /**
     * Delete a specific key
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Delete keys matching a pattern (e.g. all cache for a specific store)
     */
    deletePattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear the entire cache
     */
    clear(): void {
        this.cache.clear();
    }
}

// Singleton instance for product related caching
export const productCache = new SimpleCache();
