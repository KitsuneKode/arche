'use client'

import { authClient } from '@arche-template/auth/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { SignInPanel } from '@/components/live/sign-in-panel'
import { readProofRunProgress } from '@/lib/proof-run-storage'
import { useTRPC } from '@/trpc/client'

export function SessionPanel({ onSignedIn }: { onSignedIn?: () => void }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [signingOut, setSigningOut] = useState(false)
  const [savedRungCount, setSavedRungCount] = useState(0)

  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const user = sessionQuery.data?.user

  useEffect(() => {
    setSavedRungCount(readProofRunProgress().length)
  }, [])

  if (!user) {
    return <SignInPanel onSuccess={onSignedIn} />
  }

  return (
    <div className="border border-zinc-800 bg-black p-4 font-mono text-xs">
      <p className="text-[10px] tracking-widest text-amber-400 uppercase">Your session</p>
      <dl className="mt-4 space-y-2 text-zinc-300">
        <div>
          <dt className="text-[10px] text-zinc-600 uppercase">Name</dt>
          <dd className="text-sm text-white">{user.name}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-zinc-600 uppercase">Email</dt>
          <dd className="text-sm text-white">{user.email}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-zinc-600 uppercase">Proof progress</dt>
          <dd className="text-sm text-zinc-400">
            {savedRungCount
              ? `${savedRungCount} rungs saved locally`
              : 'Run proof to save progress'}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true)
          await authClient.signOut()
          await queryClient.invalidateQueries({ queryKey: trpc.auth.getSession.queryKey() })
          setSigningOut(false)
        }}
        className="mt-6 border border-zinc-700 px-3 py-2 text-[10px] tracking-widest text-zinc-300 uppercase hover:border-zinc-500 disabled:opacity-50"
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}
