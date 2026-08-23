'use client'

import { useCallback, useState } from 'react'

export function LiveResult({
  value,
  pending = false,
  error,
}: {
  value: unknown
  pending?: boolean
  error?: string | null
}) {
  const [copied, setCopied] = useState(false)
  const text = value === undefined ? '' : JSON.stringify(value, null, 2)

  const copy = useCallback(async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }, [text])

  return (
    <div className="flex min-h-[120px] flex-col border border-zinc-800 bg-zinc-950/60">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5">
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">Live result</p>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!text || pending}
          className="font-mono text-[10px] text-zinc-400 hover:text-white disabled:opacity-40"
        >
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>
      <pre className="max-h-48 flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
        {pending ? 'Running…' : error ? error : text || 'Run the probe to see output.'}
      </pre>
    </div>
  )
}
