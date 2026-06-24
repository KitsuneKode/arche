import { DocsSidebarLink } from '@/components/docs/docs-sidebar-link'
import { docsSidebarSections } from '@/lib/docs-sidebar-sections'

export function DocsSidebar() {
  return (
    <aside className="w-full shrink-0 border-b border-zinc-800 bg-zinc-950/30 p-6 md:w-64 md:border-r md:border-b-0">
      <div className="md:sticky md:top-20 md:max-h-[calc(100vh-5rem)] md:overflow-y-auto">
        <div className="mb-6 flex items-center gap-2 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          <span className="block size-1.5 bg-white" aria-hidden />
          Documentation
        </div>

        <nav className="space-y-8">
          {docsSidebarSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-xs font-bold tracking-widest text-zinc-400 uppercase">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <DocsSidebarLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
