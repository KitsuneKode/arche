import { absoluteSiteUrl } from '@/lib/seo'

export function LiveDemoJsonLd() {
  const url = absoluteSiteUrl('/live')
  const docsUrl = absoluteSiteUrl('/docs/guides/live-demo')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Arche live stack demo',
    url,
    description:
      'Interactive TypeScript fullstack demo with Relay Run mini-game, leaderboard, tRPC, Prisma, Better Auth, and proof-run verification.',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    isPartOf: {
      '@type': 'WebSite',
      url: absoluteSiteUrl('/'),
    },
    documentation: docsUrl,
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
