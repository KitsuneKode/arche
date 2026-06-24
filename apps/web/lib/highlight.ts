import { cacheLife, cacheTag } from 'next/cache'
import { createHighlighter, type Highlighter } from 'shiki'

const LANGS = [
  'typescript',
  'tsx',
  'javascript',
  'json',
  'yaml',
  'prisma',
  'bash',
  'shell',
] as const

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [...LANGS],
    })
  }
  return highlighterPromise
}

export async function highlightCode(code: string, lang = 'typescript'): Promise<string> {
  'use cache'
  cacheLife('max')
  cacheTag('site-content', 'code-examples', lang)

  const highlighter = await getHighlighter()
  const language = LANGS.includes(lang as (typeof LANGS)[number]) ? lang : 'typescript'
  return highlighter.codeToHtml(code.trimEnd(), {
    lang: language,
    theme: 'github-dark',
  })
}
