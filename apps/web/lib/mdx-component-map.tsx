import type { MDXComponents } from 'mdx/types'
import type { ReactNode } from 'react'

import { cn } from '@arche-template/ui/lib/utils'
import { CapabilityMatrixTable } from '@/components/arche/capability-matrix-table'
import {
  ArcheCliCommandTable,
  GeneratedProjectCommandTable,
  SourceTemplateCommandTable,
} from '@/components/arche/command-tables'
import { StackDiagram } from '@/components/arche/stack-diagram'
import { AgentContextMap } from '@/components/docs/agent-context-map'
import { CliFlagsTable } from '@/components/docs/cli-flags-table'
import { DocsCallout } from '@/components/docs/docs-callout'
import { DocsCodeBlock } from '@/components/docs/docs-code-block'
import { DocsNextSteps } from '@/components/docs/docs-next-steps'
import { DocsQuickLinks } from '@/components/docs/docs-quick-links'
import { MdxInlineCode } from '@/components/docs/mdx-inline-code'
import { MdxLink } from '@/components/docs/mdx-link'
import { Mermaid } from '@/components/docs/mermaid-diagram'
import { PackageManagerTabs } from '@/components/docs/package-manager-tabs'
import { PresetRegistryTable } from '@/components/docs/preset-registry-table'
import { VerificationMatrixTable } from '@/components/docs/verification-matrix-table'
import { WorkflowSteps } from '@/components/docs/workflow-steps'

function slugify(value: ReactNode): string {
  const text =
    typeof value === 'string'
      ? value
      : Array.isArray(value)
        ? value.map((part) => (typeof part === 'string' ? part : '')).join('')
        : String(value ?? '')

  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
}

function createHeading(level: 2 | 3 | 4) {
  const Tag = `h${level}` as const

  return function Heading({
    children,
    className,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) {
    const id = slugify(children)
    return (
      <Tag id={id} className={cn('group/heading', className)} {...props}>
        {id ? (
          <a
            href={`#${id}`}
            className="docs-heading-anchor"
            aria-label={`Link to section: ${id}`}
          />
        ) : null}
        {children}
      </Tag>
    )
  }
}

export const mdxComponentMap: MDXComponents = {
  h1: ({ className, children, ...props }) => (
    <h1
      className={cn(
        'mt-0 mb-8 text-3xl font-bold tracking-tight text-white md:text-4xl',
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  a: MdxLink,
  code: MdxInlineCode,
  pre: DocsCodeBlock,
  table: ({ className, ...props }) => (
    <div className="not-prose my-8 overflow-x-auto border border-zinc-800">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        'border-b border-zinc-800 bg-zinc-900 px-4 py-2 font-mono text-[10px] tracking-widest text-zinc-400 uppercase',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn('border-b border-zinc-800/80 px-4 py-3 text-zinc-300', className)}
      {...props}
    />
  ),
  AgentContextMap,
  ArcheCliCommandTable,
  CliFlagsTable,
  DocsCallout,
  GeneratedProjectCommandTable,
  PresetRegistryTable,
  SourceTemplateCommandTable,
  VerificationMatrixTable,
  WorkflowSteps,
  StackDiagram,
  Mermaid,
  PackageManagerTabs,
  DocsQuickLinks,
  DocsNextSteps,
  CapabilityMatrixTable,
}
