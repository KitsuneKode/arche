import Link from 'next/link'

import { Navbar } from '@/components/arche/navbar'
import { SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { SignInPanel } from '@/components/live/sign-in-panel'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Sign in',
  description: 'Sign in to the Arche demo API for relay write and protected proof-run steps.',
  path: '/sign-in',
})

export default function SignInPage() {
  return (
    <SiteShell>
      <Navbar />
      <SiteFrame>
        <section className="mx-auto max-w-md p-6 md:p-16">
          <p className="mb-2 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">Auth</p>
          <h1 className="mb-6 text-3xl font-bold text-white">Sign in</h1>
          <SignInPanel />
          <p className="mt-6 font-mono text-xs text-zinc-600">
            After sign-in, continue to{' '}
            <Link href="/live" className="text-white underline">
              /live
            </Link>
            .
          </p>
        </section>
      </SiteFrame>
    </SiteShell>
  )
}
