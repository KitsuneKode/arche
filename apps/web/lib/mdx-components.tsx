import type { ReactNode } from 'react'

import { cn } from '@arche-template/ui/lib/utils'

/** Wrap MDX output for consistent typography and spacing. */
export function DocsProse({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={cn('docs-prose', className)}>{children}</article>
}
