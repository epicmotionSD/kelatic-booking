// Cache utilities for improved performance
import { NextResponse } from 'next/server';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  staleWhileRevalidate?: number;
  tags?: string[];
}

export class ApiCache {
  private static cache = new Map<string, { data: any; expires: number; stale: number }>();

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  static set(key: string, data: any, config: CacheConfig): void {
    const now = Date.now();
    const expires = now + (config.ttl * 1000);
    const stale = now + ((config.staleWhileRevalidate || config.ttl) * 1000);
    
    this.cache.set(key, { data, expires, stale });
  }

  static invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  static clear(): void {
    this.cache.clear();
  }

  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig
): Promise<T> {
  const cached = ApiCache.get<T>(key);
  
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetcher().then(data => {
    ApiCache.set(key, data, config);
    return data;
  });
}

export function getCacheHeaders(config: CacheConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (config.ttl > 0) {
    headers['Cache-Control'] = `public, max-age=${config.ttl}`;
    
    if (config.staleWhileRevalidate) {
      headers['Cache-Control'] += `, stale-while-revalidate=${config.staleWhileRevalidate}`;
    }
  } else {
    headers['Cache-Control'] = 'no-cache';
  }
  
  if (config.tags && config.tags.length > 0) {
    headers['Cache-Tag'] = config.tags.join(',');
  }
  
  return headers;
}

export function cachedResponse(data: any, config: CacheConfig): NextResponse {
  return NextResponse.json(data, {
    headers: getCacheHeaders(config)
  });
}

// Common cache configurations
export const CACHE_CONFIGS = {
  SERVICES: { ttl: 300, staleWhileRevalidate: 600, tags: ['services'] }, // 5min/10min
  STYLISTS: { ttl: 180, staleWhileRevalidate: 300, tags: ['stylists'] }, // 3min/5min
  APPOINTMENTS: { ttl: 60, staleWhileRevalidate: 120, tags: ['appointments'] }, // 1min/2min
  STATIC: { ttl: 3600, staleWhileRevalidate: 7200, tags: ['static'] }, // 1hour/2hour
  DYNAMIC: { ttl: 30, staleWhileRevalidate: 60 }, // 30sec/1min
} as const;

export type CacheType = keyof typeof CACHE_CONFIGS;