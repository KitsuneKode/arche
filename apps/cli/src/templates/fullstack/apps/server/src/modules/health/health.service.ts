import { healthRepository } from './health.repository'

export const healthService = {
  async check() {
    try {
      await healthRepository.pingDatabase()
      return { status: 'OK' as const, database: 'connected' as const }
    } catch {
      return { status: 'ERROR' as const, database: 'disconnected' as const }
    }
  },
}
