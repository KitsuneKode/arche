import Link from 'next/link'

import { SignInPanel } from '@/components/live/sign-in-panel'

export const metadata = {
  title: 'Sign up',
  description: 'Create a demo account for the live proof run and relay lobby.',
}

export default function SignUpPage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Auth</p>
        <h1>Create account</h1>
      </section>
      <div className="live-auth-wrap">
        <SignInPanel initialMode="sign-up" />
        <p className="muted">
          Already have an account? <Link href="/sign-in">Sign in</Link>.
        </p>
      </div>
    </main>
  )
}
