'use client'

import { Badge } from '@arche-template/ui/components/badge'
import { Button } from '@arche-template/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@arche-template/ui/components/card'

import { useQuery } from '@tanstack/react-query'
import { getMedal, type MedalTier } from '@/lib/relay-run/engine'
import { readLocalBest } from '@/lib/relay-run/local-best'
import { readPendingScore } from '@/lib/relay-run/offline'
import { useTRPC } from '@/trpc/client'

function medalLabel(tier: MedalTier): string {
  switch (tier) {
    case 'amber':
      return 'Bronze relay'
    case 'emerald':
      return 'Silver relay'
    case 'blue':
      return 'Gold relay'
    default:
      return 'No medal yet'
  }
}

function medalClass(tier: MedalTier): string {
  switch (tier) {
    case 'amber':
      return 'border-amber-900/50 bg-amber-950/30 text-amber-400'
    case 'emerald':
      return 'border-emerald-900/50 bg-emerald-950/30 text-emerald-400'
    case 'blue':
      return 'border-blue-900/50 bg-blue-950/30 text-blue-400'
    default:
      return 'border-zinc-800 text-zinc-500'
  }
}

export function RelayRunStatsPanel({
  signedIn,
  isRegistered = signedIn,
  lastScore,
  deathId,
  offline,
  submitNote,
  onSignInClick,
}: {
  signedIn: boolean
  isRegistered?: boolean
  lastScore: number
  deathId: number
  offline?: boolean
  submitNote: string | null
  onSignInClick?: () => void
}) {
  const trpc = useTRPC()
  const myBestQuery = useQuery({
    ...trpc.game.myBest.queryOptions(),
    enabled: signedIn,
  })

  const localBest = signedIn ? 0 : readLocalBest()
  const personalBest = signedIn ? (myBestQuery.data?.score ?? 0) : localBest
  const medal = getMedal(signedIn ? personalBest : Math.max(personalBest, lastScore))

  return (
    <Card className="h-full border-zinc-800 bg-black ring-zinc-800">
      <CardHeader className="border-b border-zinc-800">
        <CardTitle className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
          Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div key={deathId} className="grid grid-cols-2 gap-3">
          <div className="border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
              Last run
            </p>
            <p className="mt-1 font-mono text-xl text-zinc-100">{lastScore}</p>
          </div>
          <div className="border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
              {isRegistered ? 'Personal best' : signedIn ? 'Guest best' : 'Local best'}
            </p>
            <p className="mt-1 font-mono text-xl text-amber-400">{personalBest}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border border-zinc-800 bg-zinc-950/30 px-3 py-2">
          <span className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            Medal
          </span>
          <Badge variant="outline" className={`font-mono text-[10px] ${medalClass(medal)}`}>
            {medalLabel(medal)}
          </Badge>
        </div>

        {submitNote ? <p className="font-mono text-[10px] text-emerald-400">{submitNote}</p> : null}

        {offline ? (
          <p className="font-mono text-[10px] text-zinc-500">
            Offline — local best is kept on this device
            {readPendingScore() !== null ? '; a signed-in score is queued to sync' : ''}.
          </p>
        ) : null}

        {!isRegistered ? (
          <div className="border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="font-mono text-xs text-zinc-500">
              {signedIn
                ? 'Guest scores are saved on this device until you create an account.'
                : 'Scores stay on this device until you play online or sign in.'}
            </p>
            {onSignInClick ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 border-zinc-700 font-mono text-[10px] tracking-widest uppercase"
                onClick={onSignInClick}
              >
                Sign in to save
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
