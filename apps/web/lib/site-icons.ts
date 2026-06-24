/** Bump when favicon / PWA assets change to bust browser caches. */
export const SITE_ICON_VERSION = 2

export function siteIconUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${normalized}?v=${SITE_ICON_VERSION}`
}

export const SITE_ICONS = {
  faviconIco: siteIconUrl('/favicon.ico'),
  faviconSvg: siteIconUrl('/favicon.svg'),
  appleTouchIcon: siteIconUrl('/apple-touch-icon.png'),
  manifest: siteIconUrl('/site.webmanifest'),
} as const
