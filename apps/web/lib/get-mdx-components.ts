import type { MDXComponents } from 'mdx/types'

import { mdxComponentMap } from '@/lib/mdx-component-map'

export function getMdxComponents(overrides?: MDXComponents): MDXComponents {
  return {
    ...mdxComponentMap,
    ...overrides,
  }
}
