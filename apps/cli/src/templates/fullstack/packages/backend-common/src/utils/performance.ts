/**
 * Performance monitoring hooks
 *
 * Track key performance metrics for observability and optimization.
 * Use these to identify bottlenecks and monitor production performance.
 */

type PerformanceMetric = {
  name: string
  duration: number
  timestamp: number
  tags?: Record<string, string>
}

const metrics: PerformanceMetric[] = []

/**
 * Record a performance metric
 */
export function recordMetric(name: string, duration: number, tags?: Record<string, string>) {
  metrics.push({
    name,
    duration,
    timestamp: Date.now(),
    tags,
  })

  // In production, send to monitoring service (DataDog, New Relic, etc.)
  if (process.env.NODE_ENV === 'production' && duration > 1000) {
    console.warn(`[PERF] ${name} took ${duration}ms (slow)`, tags)
  }
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>,
): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const duration = performance.now() - start
    recordMetric(name, duration, tags)
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
  const start = performance.now()
  try {
    return fn()
  } finally {
    const duration = performance.now() - start
    recordMetric(name, duration, tags)
  }
}

/**
 * Get metrics for the current session (for debugging)
 */
export function getMetrics() {
  return metrics
}

/**
 * Clear metrics
 */
export function clearMetrics() {
  metrics.length = 0
}

/**
 * Get average duration for a metric name
 */
export function getMetricStats(name: string) {
  const filtered = metrics.filter((m) => m.name === name)
  if (filtered.length === 0) return null

  const durations = filtered.map((m) => m.duration)
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  const max = Math.max(...durations)
  const min = Math.min(...durations)

  return { count: durations.length, avg, min, max }
}
