/**
 * Docker Compose generator
 *
 * Generates docker-compose.yml (dev) and docker-compose.prod.yml adapted to
 * the selected database, backend, and worker.
 *
 * - postgres: PostgreSQL container + Redis
 * - sqlite: Redis only (SQLite is file-based, no container needed)
 * - none: Redis only
 */

import type { ProjectConfig } from '../../types/schemas'
import { sanitizeProjectName } from '../slug'

function backendUsesServiceApi(config: ProjectConfig): boolean {
  return (
    config.backend === 'rust-axum' ||
    config.backend === 'rust-actix' ||
    config.backend === 'go-fiber' ||
    config.backend === 'python-fastapi'
  )
}

function buildDbService(config: ProjectConfig): { services: string[]; volumes: string[] } {
  const services: string[] = []
  const volumes: string[] = []

  if (config.database === 'postgres') {
    const databaseName = sanitizeProjectName(config.projectName).replace(/-/g, '_')
    services.push(`  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${databaseName}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data`)
    volumes.push('  postgres-data:')
  }

  return { services, volumes }
}

function buildRedisService(config: ProjectConfig): { services: string[]; volumes: string[] } {
  if (config.family !== 'fullstack' && config.family !== 'polyglot') {
    return { services: [], volumes: [] }
  }
  if (config.backend === 'none') return { services: [], volumes: [] }

  return {
    services: [
      `  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data`,
    ],
    volumes: ['  redis-data:'],
  }
}

import { renderRustDockerCompose } from './rust'

export function renderDockerCompose(config: ProjectConfig): string {
  if (config.family === 'rust') {
    return renderRustDockerCompose(config)
  }

  if (config.family === 'polyglot') {
    return `services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
`
  }

  const { services: dbServices, volumes: dbVolumes } = buildDbService(config)
  const { services: redisServices, volumes: redisVolumes } = buildRedisService(config)

  const allServices = [...dbServices, ...redisServices]
  const allVolumes = [...dbVolumes, ...redisVolumes]

  if (allServices.length === 0) {
    return `# No Docker services needed for this configuration.\n`
  }

  return `services:\n${allServices.join('\n\n')}\n\nvolumes:\n${allVolumes.join('\n')}\n`
}

export function renderDockerComposeProd(config: ProjectConfig): string {
  if (config.family === 'polyglot') {
    return `# Production Docker Compose
# Usage: docker compose -f docker-compose.prod.yml up -d

services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api:3001
    ports:
      - "3000:3000"
    depends_on:
      api:
        condition: service_started

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - FRONTEND_URL=http://web:3000
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3001/health || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 6

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    restart: unless-stopped
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_started

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data

volumes:
  redis-data:

networks:
  default:
    name: ${sanitizeProjectName(config.projectName)}-polyglot
`
  }

  const { services: dbServices, volumes: dbVolumes } = buildDbService(config)
  const { services: redisServices, volumes: redisVolumes } = buildRedisService(config)
  const serviceApi = backendUsesServiceApi(config)
  const apiServiceName = serviceApi ? 'api' : 'server'

  const appServices: string[] = [...dbServices, ...redisServices]
  const appVolumes: string[] = [...dbVolumes, ...redisVolumes]

  // Web (Next.js)
  appServices.push(`  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    env_file: ./apps/web/.env
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
    depends_on:
      - ${apiServiceName}`)

  // Server
  appServices.push(`  ${apiServiceName}:
    build:
      context: .
      dockerfile: ${serviceApi ? 'services/api/Dockerfile' : 'apps/server/Dockerfile'}
    restart: unless-stopped
    env_file: ./${serviceApi ? 'services/api' : 'apps/server'}/.env
    environment:
      - NODE_ENV=production
    ports:
      - "3001:3001"
    depends_on:
      - redis${config.database === 'postgres' ? '\n      - postgres' : ''}`)

  // Worker
  if (config.includeWorker) {
    appServices.push(`  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    restart: unless-stopped
    env_file: ./apps/worker/.env
    environment:
      - NODE_ENV=production
    depends_on:
      - server
      - redis`)
  }

  // Nginx reverse proxy
  appServices.push(`  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
      - ${apiServiceName}`)

  return `# Production Docker Compose
# Usage: docker compose -f docker-compose.prod.yml up -d

services:\n${appServices.join('\n\n')}\n\nvolumes:\n${appVolumes.join('\n')}\n

networks:
  default:
    name: ${sanitizeProjectName(config.projectName)}-prod
`
}
