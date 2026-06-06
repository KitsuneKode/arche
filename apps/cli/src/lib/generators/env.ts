/**
 * Environment file generator
 *
 * Generates .env and .env.example files adapted to the selected
 * database, backend, and runtime configuration.
 */

import type { ProjectConfig } from '../../types/schemas'
import { sanitizeProjectName } from '../slug'

/** Build DATABASE_URL for the selected database */
function buildDatabaseUrl(config: ProjectConfig): string | null {
  const safeName = sanitizeProjectName(config.projectName).replace(/-/g, '_')

  switch (config.database) {
    case 'postgres':
      return `postgresql://postgres:postgres@localhost:5432/${safeName}`
    case 'sqlite':
      return `file:./dev.db`
    case 'mongodb':
      return `mongodb://mongo:mongo@localhost:27017/${safeName}?authSource=admin`
    case 'none':
      return null
  }
}

/** Server .env content */
export function buildServerEnv(config: ProjectConfig): string {
  const lines: string[] = [
    `# ============================================`,
    `# Core Configuration`,
    `# ============================================`,
    `PORT=8080`,
    `NODE_ENV=development`,
  ]

  // Database URL (local docker by default, with alternatives commented)
  const dbUrl = buildDatabaseUrl(config)
  if (dbUrl) {
    lines.push(`DATABASE_URL=${dbUrl}`)

    // Add commented alternatives for production
    if (config.database === 'postgres') {
      lines.push(
        `# Production alternatives:`,
        `# DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/dbname`,
        `# DATABASE_URL=postgresql://user:password@db.neon.tech:5432/dbname?sslmode=require`,
        `# DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres`,
      )
    } else if (config.database === 'mongodb') {
      lines.push(
        `# Production alternatives:`,
        `# DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/dbname`,
        `# DATABASE_URL=mongodb://user:password@mongo.mongodb.net:27017/dbname`,
      )
    }
  }

  lines.push(
    ``,
    `# ============================================`,
    `# Backend & API`,
    `# ============================================`,
    `FRONTEND_URL=http://localhost:3000`,
    `REDIS_URL=redis://localhost:6379`,
    `# Production: REDIS_URL=redis://:password@redis.example.com:6379`,
    ``,
    `# ============================================`,
    `# Authentication (Better Auth)`,
    `# ============================================`,
    `BETTER_AUTH_SECRET=replace-with-a-long-random-secret`,
    `BETTER_AUTH_URL=http://localhost:8080`,
    `# Production: BETTER_AUTH_URL=https://api.example.com`,
    ``,
    `# ============================================`,
    `# OAuth Providers (Optional)`,
    `# ============================================`,
    `# GITHUB_CLIENT_ID=your_github_client_id`,
    `# GITHUB_CLIENT_SECRET=your_github_client_secret`,
    `# GOOGLE_CLIENT_ID=your_google_client_id`,
    `# GOOGLE_CLIENT_SECRET=your_google_client_secret`,
  )

  return lines.join('\n') + '\n'
}

/** Web .env content */
export function buildWebEnv(): string {
  return `# ============================================
# Frontend Configuration
# ============================================
NEXT_PUBLIC_SITE_NAME=My App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_DESCRIPTION=A full-stack TypeScript application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Production: NEXT_PUBLIC_API_URL=https://api.example.com
`
}
