import { healthRepository } from './health.repository'

export type HealthCheckResult =
  | { status: 'OK'; database: 'connected'; schema: 'ready' }
  | { status: 'OK'; database: 'connected'; schema: 'pending' }
  | { status: 'ERROR'; database: 'disconnected'; schema: 'unknown' }

export const healthService = {
  async check(): Promise<HealthCheckResult> {
    try {
      await healthRepository.pingDatabase()
    } catch {
      return { status: 'ERROR', database: 'disconnected', schema: 'unknown' }
    }

    try {
      const schemaReady = await healthRepository.isLiveDemoSchemaReady()
      if (!schemaReady) {
        return { status: 'OK', database: 'connected', schema: 'pending' }
      }
      return { status: 'OK', database: 'connected', schema: 'ready' }
    } catch {
      return { status: 'OK', database: 'connected', schema: 'pending' }
    }
  },
}
