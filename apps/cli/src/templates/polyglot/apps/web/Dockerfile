FROM oven/bun:1.3.11-alpine

WORKDIR /app

COPY package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN bun install

COPY . .
RUN bun run build --filter=@acme/polyglot-web

EXPOSE 3000
CMD ["bun", "run", "--cwd", "apps/web", "start"]
