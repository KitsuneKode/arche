import type { ReactNode } from 'react'

export function LivePanelShell({
  title,
  subtitle,
  meta,
  footer,
  scroll = true,
  compact = false,
  children,
}: {
  title: string
  subtitle?: string
  meta?: ReactNode
  footer?: ReactNode
  scroll?: boolean
  compact?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col border border-zinc-800 bg-black">
      <div
        className={`shrink-0 border-b border-zinc-800 bg-zinc-900/50 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
              {title}
            </p>
            {subtitle ? (
              <p
                className={`mt-0.5 truncate ${compact ? 'text-[11px] text-zinc-500' : 'text-sm text-zinc-400'}`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {meta}
        </div>
      </div>
      <div
        className={
          scroll
            ? 'min-h-0 min-w-0 flex-1 overflow-y-auto'
            : 'relative min-h-0 min-w-0 flex-1 overflow-hidden'
        }
      >
        {children}
      </div>
      {footer ? <div className="shrink-0 border-t border-zinc-800">{footer}</div> : null}
    </div>
  )
}
