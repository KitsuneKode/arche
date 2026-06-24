import { createMDX } from 'fumadocs-mdx/next'

function apiUpstreamOrigin() {
  const upstream = process.env.API_UPSTREAM_URL?.trim()
  if (!upstream) return null
  return upstream.replace(/\/$/, '')
}

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['@arche-template/ui', '@arche-template/registry'],
  cacheComponents: true,
  async rewrites() {
    const base = apiUpstreamOrigin()
    if (!base) return []
    return [
      { source: '/api/:path*', destination: `${base}/api/:path*` },
      { source: '/health', destination: `${base}/health` },
    ]
  },
  async redirects() {
    return [
      { source: '/docs', destination: '/docs/getting-started', permanent: false },
      { source: '/docs/auth', destination: '/docs/packages/auth', permanent: false },
      { source: '/docs/store', destination: '/docs/packages/store', permanent: false },
      { source: '/docs/trpc', destination: '/docs/packages/trpc', permanent: false },
      { source: '/docs/deploy', destination: '/docs/operations/deploy', permanent: false },
      { source: '/docs/scaling', destination: '/docs/operations/scaling', permanent: false },
      { source: '/docs/security', destination: '/docs/operations/security', permanent: false },
      {
        source: '/blog',
        has: [{ type: 'query', key: 'category', value: 'changelog' }],
        destination: '/blog/category/changelog',
        permanent: true,
      },
      {
        source: '/blog',
        has: [{ type: 'query', key: 'category', value: 'guide' }],
        destination: '/blog/category/guide',
        permanent: true,
      },
      {
        source: '/blog',
        has: [{ type: 'query', key: 'category', value: 'technical' }],
        destination: '/blog/category/technical',
        permanent: true,
      },
    ]
  },
  turbopack: {
    resolveAlias: {
      '#fumadocs': './.source/source.config.mjs',
    },
  },
}

const withMDX = createMDX()

export default withMDX(config)
