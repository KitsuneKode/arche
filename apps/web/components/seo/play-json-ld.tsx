import { absoluteSiteUrl } from '@/lib/seo'

export function PlayJsonLd() {
  const url = absoluteSiteUrl('/play')
  const docsUrl = absoluteSiteUrl('/docs/guides/live-demo')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Arche Relay — live chat and stack ping',
    url,
    description:
      'Lightweight interactive demo: real-time chat via tRPC and API latency checks against the arche.dev stack.',
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
