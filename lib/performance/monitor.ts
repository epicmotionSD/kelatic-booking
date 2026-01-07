// Performance monitoring utilities
import { NextRequest } from 'next/server';

export interface PerformanceMetrics {
  timestamp: number;
  route: string;
  method: string;
  duration: number;
  statusCode: number;
  userAgent?: string;
  ip?: string;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 1000; // Keep last 1000 requests

  static startTimer(): { end: () => number } {
    const start = performance.now();
    return {
      end: () => performance.now() - start
    };
  }

  static recordMetric(
    route: string,
    method: string,
    duration: number,
    statusCode: number,
    request?: NextRequest
  ): void {
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      route,
      method,
      duration,
      statusCode,
      userAgent: request?.headers.get('user-agent') || undefined,
      ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    };

    this.metrics.push(metric);

    // Keep only the last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request detected: ${method} ${route} - ${duration.toFixed(2)}ms`);
    }

    // Log errors
    if (statusCode >= 400) {
      console.error(`Error response: ${method} ${route} - ${statusCode} in ${duration.toFixed(2)}ms`);
    }
  }

  static getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  static getAverageResponseTime(route?: string): number {
    const relevantMetrics = route 
      ? this.metrics.filter(m => m.route === route)
      : this.metrics;
    
    if (relevantMetrics.length === 0) return 0;
    
    const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / relevantMetrics.length;
  }

  static getSlowRequests(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  static getErrorRate(route?: string): number {
    const relevantMetrics = route 
      ? this.metrics.filter(m => m.route === route)
      : this.metrics;
    
    if (relevantMetrics.length === 0) return 0;
    
    const errorCount = relevantMetrics.filter(m => m.statusCode >= 400).length;
    return (errorCount / relevantMetrics.length) * 100;
  }

  static getStats() {
    const now = Date.now();
    const last24h = this.metrics.filter(m => now - m.timestamp < 24 * 60 * 60 * 1000);
    const lastHour = this.metrics.filter(m => now - m.timestamp < 60 * 60 * 1000);

    return {
      total: this.metrics.length,
      last24h: last24h.length,
      lastHour: lastHour.length,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      slowRequests: this.getSlowRequests().length,
      topRoutes: this.getTopRoutes(),
    };
  }

  private static getTopRoutes(): Array<{ route: string; count: number; avgTime: number }> {
    const routeCounts = new Map<string, { count: number; totalTime: number }>();
    
    this.metrics.forEach(metric => {
      const existing = routeCounts.get(metric.route) || { count: 0, totalTime: 0 };
      routeCounts.set(metric.route, {
        count: existing.count + 1,
        totalTime: existing.totalTime + metric.duration
      });
    });

    return Array.from(routeCounts.entries())
      .map(([route, stats]) => ({
        route,
        count: stats.count,
        avgTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  static clear(): void {
    this.metrics = [];
  }
}

// Middleware wrapper for automatic performance tracking
export function withPerformanceTracking(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    const timer = PerformanceMonitor.startTimer();
    const route = new URL(req.url).pathname;
    const method = req.method;
    
    let response: Response;
    
    try {
      response = await handler(req);
      
      const duration = timer.end();
      PerformanceMonitor.recordMetric(route, method, duration, response.status, req);
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
      response.headers.set('X-Timestamp', Date.now().toString());
      
      return response;
    } catch (error) {
      const duration = timer.end();
      PerformanceMonitor.recordMetric(route, method, duration, 500, req);
      throw error;
    }
  };
}

// React hook for client-side performance monitoring
export function usePerformanceMonitor() {
  const measurePageLoad = () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        timeToFirstByte: navigation.responseStart - navigation.requestStart,
        resourceLoadTime: navigation.loadEventEnd - navigation.responseEnd,
      };
    }
    return null;
  };

  const measureLargestContentfulPaint = (): Promise<number> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
          observer.disconnect();
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 10000);
      } else {
        resolve(0);
      }
    });
  };

  return {
    measurePageLoad,
    measureLargestContentfulPaint,
  };
}