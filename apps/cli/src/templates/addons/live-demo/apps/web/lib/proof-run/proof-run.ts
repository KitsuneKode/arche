export type ProofRungId =
  | 'shell'
  | 'api'
  | 'contract'
  | 'datastore'
  | 'relay-read'
  | 'session'
  | 'game-board'
  | 'relay-write'
  | 'game-score'
  | 'secret'
  | 'challenge-chat'
  | 'challenge-post'

export type ProofRungDef = {
  id: ProofRungId
  layer: string
  label: string
  requiresAuth?: boolean
}

export const PROOF_RUNGS: ProofRungDef[] = [
  { id: 'shell', layer: 'Web', label: 'App shell rendered' },
  { id: 'api', layer: 'API', label: 'Health + database connected' },
  { id: 'contract', layer: 'tRPC', label: 'Typed hello contract' },
  { id: 'datastore', layer: 'Prisma', label: 'Published posts readable' },
  { id: 'relay-read', layer: 'Chat', label: 'Live chat feed' },
  { id: 'session', layer: 'Auth', label: 'Session probe (guest OK)' },
  { id: 'game-board', layer: 'Game', label: 'Leaderboard readable' },
  { id: 'relay-write', layer: 'Chat', label: 'Silent send verify', requiresAuth: true },
  { id: 'game-score', layer: 'Game', label: 'Score submit', requiresAuth: true },
  { id: 'secret', layer: 'Auth', label: 'Protected procedure', requiresAuth: true },
  {
    id: 'challenge-chat',
    layer: 'Challenge',
    label: 'Message containing arche',
    requiresAuth: true,
  },
  { id: 'challenge-post', layer: 'Challenge', label: 'Create a draft note', requiresAuth: true },
]

export type ProofRungState = 'pass' | 'fail' | 'locked'

export type ProofRungResult = {
  id: ProofRungId
  state: ProofRungState
  receipt?: string
}

export type ProofRunContext = {
  apiReachable: boolean
  fetchHealth: () => Promise<{ ok: boolean; status: number; database?: string }>
  fetchHello: () => Promise<string>
  fetchPosts: () => Promise<unknown[]>
  fetchChatMessages: () => Promise<Array<{ senderId: string; content: string }>>
  fetchSession: () => Promise<{
    user?: { id: string; name?: string | null; email?: string | null }
  } | null>
  fetchLeaderboard: () => Promise<unknown[]>
  fetchMyBest: () => Promise<{ score: number } | null>
  verifyChatSend: (content: string) => Promise<void>
  submitGameScore: (score: number) => Promise<void>
  fetchSecretMessage: () => Promise<string>
  createDraftPost: (input: { title: string; content: string; slug: string }) => Promise<void>
}

async function voidSend(send: () => Promise<unknown>) {
  await send()
}

export async function runProofRungs(ctx: ProofRunContext): Promise<ProofRungResult[]> {
  const results: ProofRungResult[] = [{ id: 'shell', state: 'pass', receipt: 'Live route mounted' }]

  if (!ctx.apiReachable) {
    results.push({
      id: 'api',
      state: 'fail',
      receipt: 'API unreachable — check NEXT_PUBLIC_API_URL',
    })
    return results
  }

  try {
    const health = await ctx.fetchHealth()
    if (!health.ok || health.database !== 'connected') {
      results.push({ id: 'api', state: 'fail', receipt: `Health ${health.status}` })
      return results
    }
    results.push({ id: 'api', state: 'pass', receipt: 'database: connected' })
  } catch {
    results.push({ id: 'api', state: 'fail', receipt: 'Network error' })
    return results
  }

  try {
    const hello = await ctx.fetchHello()
    results.push({ id: 'contract', state: 'pass', receipt: hello })
  } catch {
    results.push({ id: 'contract', state: 'fail', receipt: 'hello query failed' })
    return results
  }

  try {
    const posts = await ctx.fetchPosts()
    if (!posts.length) {
      results.push({ id: 'datastore', state: 'fail', receipt: 'No published posts — run db:seed' })
      return results
    }
    results.push({ id: 'datastore', state: 'pass', receipt: `${posts.length} published` })
  } catch {
    results.push({ id: 'datastore', state: 'fail', receipt: 'post.list failed' })
    return results
  }

  try {
    const messages = await ctx.fetchChatMessages()
    results.push({ id: 'relay-read', state: 'pass', receipt: `${messages.length} messages` })
  } catch {
    results.push({ id: 'relay-read', state: 'fail', receipt: 'chat.list failed' })
    return results
  }

  let sessionUserId: string | undefined
  try {
    const session = await ctx.fetchSession()
    const who = session?.user?.name ?? session?.user?.email ?? 'guest'
    sessionUserId = session?.user?.id
    results.push({ id: 'session', state: 'pass', receipt: who })
  } catch {
    results.push({ id: 'session', state: 'fail', receipt: 'getSession failed' })
    return results
  }

  try {
    const board = await ctx.fetchLeaderboard()
    results.push({ id: 'game-board', state: 'pass', receipt: `${board.length} entries` })
  } catch {
    results.push({ id: 'game-board', state: 'fail', receipt: 'game.leaderboard failed' })
    return results
  }

  if (!sessionUserId) {
    for (const id of [
      'relay-write',
      'game-score',
      'secret',
      'challenge-chat',
      'challenge-post',
    ] as const) {
      results.push({ id, state: 'locked', receipt: 'Sign in to unlock' })
    }
    return results
  }

  try {
    await voidSend(() => ctx.verifyChatSend('proof-run verify'))
    results.push({ id: 'relay-write', state: 'pass', receipt: 'chat.verifySend ok' })
  } catch (error) {
    results.push({
      id: 'relay-write',
      state: 'fail',
      receipt: error instanceof Error ? error.message : 'verify failed',
    })
  }

  try {
    const best = await ctx.fetchMyBest()
    if (best && best.score >= 1) {
      results.push({ id: 'game-score', state: 'pass', receipt: `best: ${best.score}` })
    } else {
      await voidSend(() => ctx.submitGameScore(1))
      results.push({ id: 'game-score', state: 'pass', receipt: 'score saved' })
    }
  } catch (error) {
    results.push({
      id: 'game-score',
      state: 'fail',
      receipt: error instanceof Error ? error.message : 'submit failed',
    })
  }

  try {
    const secret = await ctx.fetchSecretMessage()
    results.push({ id: 'secret', state: 'pass', receipt: secret })
  } catch {
    results.push({ id: 'secret', state: 'fail', receipt: 'getSecretMessage failed' })
  }

  try {
    const messages = await ctx.fetchChatMessages()
    const hasArche = messages.some(
      (message) =>
        message.senderId === sessionUserId && message.content.toLowerCase().includes('arche'),
    )
    if (!hasArche) {
      results.push({
        id: 'challenge-chat',
        state: 'fail',
        receipt: 'Post a message containing arche',
      })
    } else {
      results.push({ id: 'challenge-chat', state: 'pass', receipt: 'arche message verified' })
    }
  } catch (error) {
    results.push({
      id: 'challenge-chat',
      state: 'fail',
      receipt: error instanceof Error ? error.message : 'challenge failed',
    })
  }

  try {
    const slug = `proof-note-${Date.now().toString(36)}`
    await voidSend(() =>
      ctx.createDraftPost({
        title: 'Proof run note',
        content: 'Draft created from the live demo challenge.',
        slug,
      }),
    )
    results.push({ id: 'challenge-post', state: 'pass', receipt: 'draft saved' })
  } catch (error) {
    results.push({
      id: 'challenge-post',
      state: 'fail',
      receipt: error instanceof Error ? error.message : 'draft failed',
    })
  }

  return results
}

export function passedRungIds(results: ProofRungResult[]): string[] {
  return results.filter((result) => result.state === 'pass').map((result) => result.id)
}
