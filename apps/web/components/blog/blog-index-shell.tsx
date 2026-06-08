import type { ReactNode } from 'react'

import { notesHeroEyebrow } from '@/components/arche/hero-eyebrows'
import { Navbar } from '@/components/arche/navbar'
import { HeroBlock, SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { BlogCategoryNav } from '@/components/blog/blog-category-nav'
import type { BlogCategory } from '@/lib/blog-source'

type Props = {
  activeCategory: BlogCategory | 'all'
  children: ReactNode
}

export function BlogIndexShell({ activeCategory, children }: Props) {
  return (
    <SiteShell className="overflow-x-hidden">
      <Navbar />
      <SiteFrame>
        <HeroBlock eyebrow={notesHeroEyebrow} title="Writing" accent="about the vault." size="md">
          Changelog entries when something ships, guides when you need a path, technical posts when
          the implementation is the story. Filter by intent—not hype.
        </HeroBlock>

        <section className="border-b border-zinc-800 bg-black px-6 py-6 md:px-12">
          <BlogCategoryNav activeCategory={activeCategory} />
        </section>

        <section className="flex-1 bg-black">{children}</section>
      </SiteFrame>
    </SiteShell>
  )
}
