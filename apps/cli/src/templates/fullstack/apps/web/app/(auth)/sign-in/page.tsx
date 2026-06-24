import Link from 'next/link'

import { SignInPanel } from '@/components/live/sign-in-panel'

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to the demo API for relay write and protected proof-run steps.',
}

export default function SignInPage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Auth</p>
        <h1>Sign in</h1>
        <p className="lede">Demo auth against your real API.</p>
      </section>
      <div className="live-auth-wrap">
        <SignInPanel />
        <p className="muted">
          Continue to <Link href="/live">/live</Link> after sign-in.
        </p>
      </div>
    </main>
  )
}
