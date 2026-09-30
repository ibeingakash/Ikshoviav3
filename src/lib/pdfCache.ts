/**
 * In-Memory & Cache-Storage backed PDF Buffer Cache.
 * Prevents re-downloading multi-megabyte PDFs across tab switches,
 * component re-renders, or page navigations.
 */

const memoryCache = new Map<string, ArrayBuffer>();

export const pdfCache = {
  /**
   * Get cached PDF ArrayBuffer by key (e.g. resourceId or URL)
   */
  async get(key: string): Promise<ArrayBuffer | null> {
    // 1. In-memory check (fastest)
    if (memoryCache.has(key)) {
      return memoryCache.get(key)!.slice(0);
    }

    // 2. Cache API check (if browser supports window.caches)
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await window.caches.open('ikshovia-pdf-cache-v1');
        const match = await cache.match(key);
        if (match) {
          const buf = await match.arrayBuffer();
          memoryCache.set(key, buf);
          return buf.slice(0);
        }
      } catch (e) {
        // quiet fallback
      }
    }

    return null;
  },

  /**
   * Put PDF ArrayBuffer into cache
   */
  async set(key: string, buffer: ArrayBuffer): Promise<void> {
    memoryCache.set(key, buffer.slice(0));

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await window.caches.open('ikshovia-pdf-cache-v1');
        const response = new Response(buffer.slice(0), {
          headers: {
            'Content-Type': 'application/pdf',
            'Cache-Control': 'public, max-age=604800',
          },
        });
        await cache.put(key, response);
      } catch (e) {
        // quiet fallback
      }
    }
  },

  /**
   * Check if PDF is cached
   */
  has(key: string): boolean {
    return memoryCache.has(key);
  },

  /**
   * Clear cache if needed
   */
  clear(): void {
    memoryCache.clear();
  },
};
