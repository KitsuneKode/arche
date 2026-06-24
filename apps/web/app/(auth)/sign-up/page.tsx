import Link from 'next/link'

import { Navbar } from '@/components/arche/navbar'
import { SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { SignInPanel } from '@/components/live/sign-in-panel'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Sign up',
  description: 'Create a demo account for the Arche live proof run and relay lobby.',
  path: '/sign-up',
})

export default function SignUpPage() {
  return (
    <SiteShell>
      <Navbar />
      <SiteFrame>
        <section className="mx-auto max-w-md p-6 md:p-16">
          <p className="mb-2 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">Auth</p>
          <h1 className="mb-6 text-3xl font-bold text-white">Create account</h1>
          <SignInPanel initialMode="sign-up" />
          <p className="mt-6 font-mono text-xs text-zinc-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-white underline">
              Sign in
            </Link>
            .
          </p>
        </section>
      </SiteFrame>
    </SiteShell>
  )
}
