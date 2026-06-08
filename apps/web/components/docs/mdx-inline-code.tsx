'use client'

import type { ComponentProps } from 'react'
import { highlight } from 'sugar-high'

import { cn } from '@arche-template/ui/lib/utils'
import { getSingleTextChild } from '@/lib/react-node-text'

/** Inline `code` only — fenced blocks use DocsCodeBlock on `pre`. */
export function MdxInlineCode({ children, className, ...props }: ComponentProps<'code'>) {
  const text = getSingleTextChild(children)
  const isFenced = Boolean(className?.includes('language-'))

  if (!text || isFenced) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  return (
    <code
      className={cn('mdx-inline-code', className)}
      dangerouslySetInnerHTML={{ __html: highlight(text) }}
      {...props}
    />
  )
}
