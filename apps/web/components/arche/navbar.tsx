'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@arche-template/ui/lib/utils'

import { BrandMark } from '@/components/arche/brand-mark'

const links = [
  { href: '/families', label: 'Families' },
  { href: '/live', label: 'Live demo' },
  { href: '/docs/getting-started', label: 'Docs', matchPrefix: '/docs' },
  { href: '/examples', label: 'Examples' },
  { href: '/blog', label: 'Blog' },
]

function isNavActive(pathname: string, href: string, matchPrefix?: string) {
  const base = matchPrefix ?? href
  return pathname === href || pathname.startsWith(`${base}/`) || pathname === base
}

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-[1200px] flex-col border-r border-l border-zinc-800">
        <div className="flex h-14 items-center justify-between px-6">
          <Link
            href="/"
            transitionTypes={['route-soft']}
            className="flex min-h-10 items-center gap-4 text-sm font-bold tracking-tight uppercase transition-[opacity] duration-150 hover:opacity-80"
          >
            <BrandMark size={28} className="text-white" />
            ARCHE
          </Link>

          <div className="hidden items-center gap-6 text-[11px] font-bold tracking-[0.15em] uppercase lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                transitionTypes={['route-soft']}
                className={cn(
                  'inline-flex min-h-10 items-center px-2 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]',
                  isNavActive(
                    pathname,
                    link.href,
                    'matchPrefix' in link ? link.matchPrefix : undefined,
                  )
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white',
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/KitsuneKode/arche"
              className="inline-flex min-h-10 items-center text-zinc-400 transition-colors hover:text-white"
            >
              GitHub ↗
            </a>
          </div>

          <button
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center border border-zinc-800 font-mono text-xs text-white uppercase lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>

        {open ? (
          <div
            id="mobile-nav"
            className="flex flex-col gap-1 border-t border-zinc-800 px-4 py-3 lg:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'inline-flex min-h-10 items-center px-3 font-mono text-xs tracking-widest uppercase transition-colors',
                  isNavActive(
                    pathname,
                    link.href,
                    'matchPrefix' in link ? link.matchPrefix : undefined,
                  )
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white',
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/KitsuneKode/arche"
              className="inline-flex min-h-10 items-center px-3 font-mono text-xs tracking-widest text-zinc-400 uppercase"
            >
              GitHub ↗
            </a>
          </div>
        ) : null}
      </nav>
    </div>
  )
}
