FROM oven/bun:1.3.11-alpine

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
RUN bun install

COPY apps/api apps/api
RUN bun run build --filter=@acme/polyglot-api

EXPOSE 3001
CMD ["bun", "run", "--cwd", "apps/api", "start"]
