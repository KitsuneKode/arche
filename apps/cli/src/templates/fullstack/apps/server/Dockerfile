# Build from repository root (required for turbo prune + workspace layout):
#   bun run docker:build
#   docker build -f apps/server/Dockerfile .
#
# Render/Railway: docker context = repo root, dockerfilePath = apps/server/Dockerfile

ARG BUN_VERSION=1.3.12

FROM oven/bun:${BUN_VERSION} AS base
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# --- Prune to @arche-template/server workspace closure ---
FROM base AS pruner
COPY . .
RUN bunx turbo@2.9.14 prune @arche-template/server --docker

# --- Install + generate + build (buzz8n-style: json install, then full sources) ---
FROM base AS builder
WORKDIR /app

COPY --from=pruner /app/out/json/ .

ENV CI=true
ENV HUSKY=0
ENV SKIP_POSTINSTALL=1
ENV TURBO_TELEMETRY_DISABLED=1

# out/json/ has no turbo.json; lifecycle scripts must not run here.
RUN --mount=type=cache,target=/root/.bun/install/cache \
  bun install --frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/full/ .
# out/full/ omits bun.lock; keep the lockfile from out/json/ for turbo + reproducible installs
COPY --from=pruner /app/out/json/bun.lock ./bun.lock

RUN bun run db:generate
RUN bun run build --filter=@arche-template/server

# --- Runtime ---
FROM oven/bun:${BUN_VERSION}-slim AS production
WORKDIR /app/apps/server

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/apps/server/package.json ./package.json

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "./dist/server.js"]
