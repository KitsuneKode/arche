import type { ReactNode } from 'react'

/** Plain text from a single MDX/React child node, when unambiguous. */
export function getSingleTextChild(node: ReactNode): string | null {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  return null
}

export function extractTextFromReactNode(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props
    return extractTextFromReactNode(props?.children ?? '')
  }
  return ''
}
