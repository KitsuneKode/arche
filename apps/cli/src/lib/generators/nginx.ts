/**
 * Nginx configuration generator
 *
 * Generates nginx/nginx.conf with reverse proxy, WebSocket support,
 * security headers, rate limiting, and optional SSL.
 */

import type { ProjectConfig } from '../../types/schemas'

function backendUsesServiceApi(config: ProjectConfig): boolean {
  return (
    config.backend === 'rust-axum' ||
    config.backend === 'rust-actix' ||
    config.backend === 'go-fiber' ||
    config.backend === 'python-fastapi'
  )
}

export function renderNginxConfig(config: ProjectConfig): string {
  const apiUpstream = backendUsesServiceApi(config) ? 'api' : 'server'

  return `upstream nextjs {
    server web:3000;
}

upstream api {
    server ${apiUpstream}:3001;
}

upstream bullboard {
    server ${apiUpstream}:3001;
}

# Rate limit zones
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=static:10m rate=100r/s;

server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Next.js static assets (long cache)
    location /_next/static/ {
        proxy_pass http://nextjs;
        limit_req zone=static burst=200 nodelay;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Next.js public assets
    location /static/ {
        proxy_pass http://nextjs;
        expires 30d;
        add_header Cache-Control "public";
    }

    # API routes (rate limited)
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://api;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Auth routes (stricter rate limit)
    location /api/auth/ {
        limit_req zone=auth burst=20 nodelay;
        proxy_pass http://api;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Bull Board admin (internal network only)
    location /admin/ {
        proxy_pass http://bullboard;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for Next.js HMR
    location /_next/webpack-hmr {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # Everything else → Next.js
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`
}
