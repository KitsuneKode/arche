import { highlightCode } from '@/lib/highlight'

import { CodeExampleClient, type CodeExampleItem } from '@/components/arche/code-example-client'

const exampleSections = [
  {
    id: 'typescript',
    title: 'TypeScript fullstack',
    examples: [
      {
        id: 'trpc',
        title: 'tRPC procedure',
        desc: 'Typed API with Zod input and protected context.',
        lang: 'typescript',
        code: `import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const userRouter = router({
  getProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findUnique({
        where: { id: input.id },
      });
    }),
});`,
      },
      {
        id: 'auth',
        title: 'Better Auth',
        desc: 'Server auth instance with Prisma adapter.',
        lang: 'typescript',
        code: `import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@arche-template/store";

export const auth = betterAuth({
  database: prismaAdapter(db),
});`,
      },
      {
        id: 'prisma',
        title: 'Prisma schema',
        desc: 'Models and relations in packages/store.',
        lang: 'prisma',
        code: `model User {
  id        String    @id @default(cuid())
  email     String    @unique
  posts     Post[]
  sessions  Session[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
}`,
      },
    ],
  },
  {
    id: 'convex',
    title: 'Convex product',
    examples: [
      {
        id: 'convex-query',
        title: 'Convex query',
        desc: 'Server function consumed from Next.js.',
        lang: 'typescript',
        code: `import { query } from "./_generated/server";
import { v } from "convex/values";

export const listPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("posts").collect();
  },
});`,
      },
    ],
  },
  {
    id: 'rust',
    title: 'Rust API',
    examples: [
      {
        id: 'axum',
        title: 'Axum handler',
        desc: 'HTTP route in the generated API crate.',
        lang: 'rust',
        code: `use axum::{Json, Router, routing::get};
use serde::Serialize;

#[derive(Serialize)]
struct Health { ok: bool }

async fn health() -> Json<Health> {
    Json(Health { ok: true })
}

pub fn router() -> Router {
    Router::new().route("/health", get(health))
}`,
      },
    ],
  },
  {
    id: 'solana',
    title: 'Solana',
    examples: [
      {
        id: 'anchor',
        title: 'Anchor program',
        desc: 'On-chain program entry pattern.',
        lang: 'rust',
        code: `use anchor_lang::prelude::*;

declare_id!("ReplaceWithProgramId");

#[program]
pub mod my_program {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}`,
      },
    ],
  },
  {
    id: 'cli',
    title: 'CLI automation',
    examples: [
      {
        id: 'create-json',
        title: 'create-json',
        desc: 'Non-interactive scaffold payload.',
        lang: 'json',
        code: `{
  "projectName": "my-app",
  "destinationDir": "/tmp/my-app",
  "preset": "typescript-fullstack",
  "packageManager": "bun",
  "initializeGit": false,
  "installDependencies": false
}`,
      },
      {
        id: 'docker',
        title: 'Docker Compose',
        desc: 'Local Postgres and Redis when --docker is enabled.',
        lang: 'yaml',
        code: `services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: arche
      POSTGRES_PASSWORD: password
      POSTGRES_DB: arche_db
    ports:
      - "5432:5432"
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"`,
      },
    ],
  },
] as const

async function highlightSection(
  section: (typeof exampleSections)[number],
): Promise<{ id: string; title: string; examples: CodeExampleItem[] }> {
  const examples = await Promise.all(
    section.examples.map(async (ex) => ({
      id: ex.id,
      title: ex.title,
      desc: ex.desc,
      highlightedHtml: await highlightCode(ex.code, ex.lang),
    })),
  )
  return { id: section.id, title: section.title, examples }
}

export async function CodeExample() {
  const sections = await Promise.all(exampleSections.map(highlightSection))

  return <CodeExampleSections sections={sections} />
}

function CodeExampleSections({
  sections,
}: {
  sections: Array<{ id: string; title: string; examples: CodeExampleItem[] }>
}) {
  return (
    <div className="space-y-16">
      {sections.map((section) => (
        <section key={section.id} id={`examples-${section.id}`}>
          <h3 className="mb-6 font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">
            {section.title}
          </h3>
          <CodeExampleClient examples={section.examples} />
        </section>
      ))}
    </div>
  )
}
