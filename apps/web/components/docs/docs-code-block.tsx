'use client'

import { cn } from '@arche-template/ui/lib/utils'
import { useCallback, useState } from 'react'
import type { ComponentProps } from 'react'

import { extractTextFromReactNode } from '@/lib/react-node-text'

type PreProps = ComponentProps<'pre'> & {
  'data-language'?: string
  title?: string
}

export function DocsCodeBlock({ children, className, title, ...props }: PreProps) {
  const [copied, setCopied] = useState(false)
  const language =
    props['data-language'] ?? (typeof title === 'string' ? title : undefined) ?? 'terminal'

  const onCopy = useCallback(async () => {
    const text = extractTextFromReactNode(children)
    if (!text) return
    await navigator.clipboard.writeText(text.trim())
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [children])

  return (
    <figure className="not-prose my-8 w-full min-w-0 overflow-hidden border border-zinc-800 bg-black shadow-[4px_4px_0_0_rgba(39,39,42,1)]">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-zinc-400 uppercase">
        <span className="truncate">{language}</span>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre
          {...props}
          className={cn(
            'm-0 min-w-0 font-mono text-sm leading-relaxed whitespace-pre text-zinc-200',
            className,
          )}
        >
          {children}
        </pre>
      </div>
    </figure>
  )
}
