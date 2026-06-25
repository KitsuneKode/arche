/** 5×5 Relay Lattice cells — stable ids used in DB seed and clash deck. */
export const LATTICE_CELLS = [
  { id: 'trpc', label: 'tRPC' },
  { id: 'sse', label: 'SSE' },
  { id: 'prisma', label: 'Prisma' },
  { id: 'auth', label: 'Better Auth' },
  { id: 'redis', label: 'Redis' },
  { id: 'nextjs', label: 'Next.js' },
  { id: 'express', label: 'Express' },
  { id: 'bullmq', label: 'BullMQ' },
  { id: 'neon', label: 'Neon' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'vercel', label: 'Vercel' },
  { id: 'render', label: 'Render' },
  { id: 'docker', label: 'Docker' },
  { id: 'turbo', label: 'Turborepo' },
  { id: 'bun', label: 'Bun' },
  { id: 'zod', label: 'Zod' },
  { id: 'react-query', label: 'React Query' },
  { id: 'polling', label: 'Polling' },
  { id: 'websocket', label: 'WebSocket' },
  { id: 'postgres', label: 'Postgres' },
  { id: 'hono', label: 'Hono' },
  { id: 'rust', label: 'Rust' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'ci', label: 'CI' },
  { id: 'monorepo', label: 'Monorepo' },
] as const

export type LatticeCellId = (typeof LATTICE_CELLS)[number]['id']

/** Themed clash pairs for binary votes. */
export const CLASH_PAIRS: [LatticeCellId, LatticeCellId][] = [
  ['sse', 'polling'],
  ['neon', 'sqlite'],
  ['vercel', 'render'],
  ['express', 'hono'],
  ['bun', 'typescript'],
  ['prisma', 'postgres'],
  ['redis', 'bullmq'],
  ['nextjs', 'react-query'],
  ['docker', 'ci'],
  ['trpc', 'websocket'],
  ['auth', 'zod'],
  ['turbo', 'monorepo'],
  ['rust', 'typescript'],
]

export const ROUND_DURATION_MS = 75_000

export const SYSTEM_USER_ID = 'user_system_arche'

export function cellLabel(id: string): string {
  return LATTICE_CELLS.find((cell) => cell.id === id)?.label ?? id
}
