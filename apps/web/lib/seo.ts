import type { Metadata } from 'next'

import { env } from '@/env'
import { SITE_ICONS } from '@/lib/site-icons'

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const SITE_NAME = env.NEXT_PUBLIC_SITE_NAME
export const SITE_DESCRIPTION = env.NEXT_PUBLIC_SITE_DESCRIPTION

export function absoluteSiteUrl(path: string): string {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  return path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function defaultOgImagePath(): string {
  return '/opengraph-image'
}

export function defaultOgImageAbsoluteUrl(): string {
  return absoluteSiteUrl(defaultOgImagePath())
}

/** Path to a route-scoped `opengraph-image` file convention endpoint. */
export function routeOgImagePath(routePath: string): string {
  const normalized = routePath.replace(/\/$/, '')
  return `${normalized || ''}/opengraph-image`
}

export function routeOgImageAbsoluteUrl(routePath: string): string {
  return absoluteSiteUrl(routeOgImagePath(routePath))
}

/** Docs use `/docs/og/[...slug]` — catch-all pages cannot host `opengraph-image.tsx`. */
export function docsOgImagePath(docPath: string): string {
  const slug = docPath.replace(/^\/docs\/?/, '')
  return slug ? `/docs/og/${slug}` : '/docs/og/getting-started'
}

export function docsOgImageAbsoluteUrl(docPath: string): string {
  return absoluteSiteUrl(docsOgImagePath(docPath))
}

type BuildPageMetadataOptions = {
  title: string
  description?: string
  path: string
  ogImagePath?: string
  ogType?: 'website' | 'article'
  publishedTime?: string
  keywords?: string[]
  authors?: Metadata['authors']
  noIndex?: boolean
  /** RSS or other alternate types keyed by MIME. */
  alternateTypes?: Record<string, string>
}

export function buildPageMetadata(options: BuildPageMetadataOptions): Metadata {
  const {
    title,
    description,
    path,
    ogImagePath = routeOgImagePath(path),
    ogType = 'website',
    publishedTime,
    keywords,
    authors,
    noIndex,
    alternateTypes,
  } = options

  const canonical = absoluteSiteUrl(path)
  const ogImage = absoluteSiteUrl(ogImagePath)

  const openGraph: Metadata['openGraph'] = {
    title,
    description,
    type: ogType,
    url: canonical,
    siteName: SITE_NAME,
    images: [
      {
        url: ogImage,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: title,
      },
    ],
    ...(publishedTime && ogType === 'article' ? { publishedTime } : {}),
  }

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(alternateTypes ? { types: alternateTypes } : {}),
    },
    authors,
    keywords,
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  }
}

export function buildRootLayoutMetadata(): Metadata {
  const canonical = absoluteSiteUrl('/')
  const ogImage = defaultOgImageAbsoluteUrl()

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: {
      default: `${SITE_NAME} — scaffold CLI & docs`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title: `${SITE_NAME} — scaffold CLI`,
      description: SITE_DESCRIPTION,
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: `${SITE_NAME} — project origin system for TypeScript, Rust, and Solana scaffolds`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — scaffold CLI`,
      description: SITE_DESCRIPTION,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: SITE_ICONS.faviconIco, sizes: '32x32', type: 'image/x-icon' },
        { url: SITE_ICONS.faviconSvg, type: 'image/svg+xml' },
      ],
      apple: [{ url: SITE_ICONS.appleTouchIcon, sizes: '180x180', type: 'image/png' }],
    },
    manifest: SITE_ICONS.manifest,
  }
}

type DocsPage = {
  url: string
  data: {
    title: string
    description?: string
  }
}

export function buildDocsPageMetadata(page: DocsPage): Metadata {
  return buildPageMetadata({
    title: page.data.title,
    description: page.data.description,
    path: page.url,
    ogImagePath: docsOgImagePath(page.url),
  })
}
