FROM oven/bun:1.3.11-alpine

WORKDIR /app

COPY package.json ./
COPY apps/worker/package.json apps/worker/package.json
RUN bun install

COPY apps/worker apps/worker

CMD ["bun", "run", "--cwd", "apps/worker", "start"]
