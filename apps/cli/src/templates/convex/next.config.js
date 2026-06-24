function apiUpstreamOrigin() {
  const upstream = process.env.API_UPSTREAM_URL?.trim()
  if (!upstream) return null
  return upstream.replace(/\/$/, '')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  async rewrites() {
    const base = apiUpstreamOrigin()
    if (!base) return []
    return [
      { source: '/api/:path*', destination: `${base}/api/:path*` },
      { source: '/health', destination: `${base}/health` },
    ]
  },
}

export default nextConfig
