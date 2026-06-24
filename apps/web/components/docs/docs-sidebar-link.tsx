'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@arche-template/ui/lib/utils'

function isActive(pathname: string, href: string) {
  if (href === '/examples') return pathname === '/examples'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DocsSidebarLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = isActive(pathname, href)

  return (
    <Link
      href={href}
      className={cn(
        'block rounded-sm px-2 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-white text-black' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white',
      )}
    >
      {label}
    </Link>
  )
}
