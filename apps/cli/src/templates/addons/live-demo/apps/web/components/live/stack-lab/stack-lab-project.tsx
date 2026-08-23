import type { ReactNode } from 'react'

export function StackLabProject({
  layer,
  title,
  description,
  code,
  children,
  actions,
}: {
  layer: string
  title: string
  description: string
  code: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <article className="border border-zinc-800 bg-black">
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">{layer}</p>
        <h3 className="mt-1 text-sm font-medium text-white">{title}</h3>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-zinc-800 p-4 lg:border-r lg:border-b-0">
          <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-zinc-400">
            {code}
          </pre>
        </div>
        <div className="p-4">{children}</div>
      </div>

      {actions ? (
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 px-4 py-3">{actions}</div>
      ) : null}
    </article>
  )
}
