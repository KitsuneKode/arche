'use client'

import { authClient } from '@arche-template/auth/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useTRPC } from '@/trpc/client'

type Mode = 'sign-in' | 'sign-up'

export function SignInPanel({
  onSuccess,
  initialMode = 'sign-in',
}: {
  onSuccess?: () => void
  initialMode?: Mode
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const capabilitiesQuery = useQuery(trpc.demo.capabilities.queryOptions())
  const autoSignIn = capabilitiesQuery.data?.autoSignIn ?? false
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('Demo User')
  const [error, setError] = useState<string | null>(null)
  const [successNote, setSuccessNote] = useState<string | null>(null)

  const authMutation = useMutation({
    mutationFn: async () => {
      setError(null)
      setSuccessNote(null)
      if (mode === 'sign-in') {
        const result = await authClient.signIn.email({ email, password })
        if (result.error) throw new Error(result.error.message ?? 'Sign in failed')
        return result
      }
      const result = await authClient.signUp.email({ email, password, name })
      if (result.error) throw new Error(result.error.message ?? 'Sign up failed')
      return result
    },
    onSuccess: async (_data, _variables, _context) => {
      await queryClient.invalidateQueries({ queryKey: trpc.auth.getSession.queryKey() })
      if (mode === 'sign-up') {
        setSuccessNote(
          autoSignIn
            ? 'Account created — you are signed in. Try Chat and Posts, then re-run proof for challenges.'
            : 'Account created — sign in to unlock write access and proof-run challenges.',
        )
      }
      onSuccess?.()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  return (
    <div className="border border-zinc-800 bg-black p-4">
      <div className="mb-4 flex gap-2 font-mono text-[10px] tracking-widest uppercase">
        <button
          type="button"
          onClick={() => setMode('sign-in')}
          className={`border px-3 py-1 ${mode === 'sign-in' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500'}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode('sign-up')}
          className={`border px-3 py-1 ${mode === 'sign-up' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-500'}`}
        >
          Sign up
        </button>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          authMutation.mutate()
        }}
      >
        {mode === 'sign-up' ? (
          <label className="block font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white"
              autoComplete="name"
              aria-label="Name"
            />
          </label>
        ) : null}

        <label className="block font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white"
            autoComplete="email"
            required
            aria-label="Email"
          />
        </label>

        <label className="block font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            aria-label="Password"
          />
        </label>

        {error ? <p className="font-mono text-xs text-red-400">{error}</p> : null}
        {successNote ? <p className="font-mono text-xs text-emerald-400">{successNote}</p> : null}

        <button
          type="submit"
          disabled={authMutation.isPending}
          className="w-full border border-white bg-white px-4 py-2 font-mono text-xs font-bold tracking-widest text-black uppercase disabled:opacity-50"
        >
          {authMutation.isPending ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-zinc-600">
        Demo auth against the real API.
        {autoSignIn
          ? ' Sign-up signs you in automatically on this deployment.'
          : ' Sign up, then sign in — or set DEMO_AUTO_SIGN_IN=true on the API for one-step demo sign-up.'}
      </p>
    </div>
  )
}
