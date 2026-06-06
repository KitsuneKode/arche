import { prisma } from '../index'

async function main() {
  console.log('🌱 Seeding database...')

  // Create a default user if not exists
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Kitsune Team',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: 'user_demo_123',
    },
  })

  const posts = [
    {
      title: 'The Future of Full-Stack: Why We Chose Monorepos',
      slug: 'future-of-full-stack-monorepos',
      content: `In the rapidly evolving landscape of web development, the architecture of your codebase is just as critical as the code itself. At KitsuneKode, we've bet big on monorepos, and specifically, the power of [Turborepo](https://turbo.build/) combined with Next.js and Express.

![Turborepo Architecture](https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=2070&auto=format&fit=crop)

## The Monorepo Advantage

Gone are the days of managing ten different repositories for a single product. Context switching kills productivity. With a monorepo, your frontend, backend, and shared libraries live in harmony.

1. **Shared Types**: Define your Zod schemas in one package and use them in your API and your UI forms. No more out-of-sync interfaces.
2. **Atomic Commits**: Change an API endpoint and the consuming frontend component in a single PR.
3. **Unified Tooling**: One lint config, one build command, one happy developer.

## Why Bun?

We switched to [Bun](https://bun.sh/) for this template because speed matters. Package installation is instant. Tests run in milliseconds. It's not just a runtime; it's a quality of life improvement.

## Conclusion

This template isn't just a starter; it's a philosophy. It's about reducing friction and letting you focus on building features that matter. Give it a spin and let us know what you build!`,
      published: true,
    },
    {
      title: 'Mastering tRPC: End-to-End Type Safety',
      slug: 'mastering-trpc-type-safety',
      content: `If you've ever had your frontend crash because the backend API changed a field name without you knowing, you need [tRPC](https://trpc.io/). It's not just a library; it's a contract between your client and server that is enforced by the compiler.

![Type Safety Visualization](https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2070&auto=format&fit=crop)

## How it Works

tRPC allows you to export the *type* of your router, not the router itself. Your frontend imports this type and suddenly, your IDE knows exactly what endpoints exist, what inputs they expect, and what they return.

\`\`\`typescript
// Backend
export const appRouter = t.router({
  hello: t.procedure.input(z.string()).query(({ input }) => {
    return \`Hello \${input}\`;
  }),
});

// Frontend
trpc.hello.useQuery('World'); // Type-safe!
\`\`\`

## The Developer Experience

The autocomplete is magical. You type \`trpc.\` and see your entire API surface. Refactoring becomes a breeze—rename a procedure in the backend, and TypeScript immediately highlights every usage in the frontend that needs updating.

## Performance

tRPC is lightweight and built on standard HTTP. With our setup using React Query (TanStack Query), you get caching, optimistic updates, and invalidation strategies out of the box.`,
      published: true,
    },
    {
      title: 'Designing for the Dark: The Kitsune Theme',
      slug: 'designing-kitsune-theme',
      content: `Dark mode isn't just about inverting colors. It's about creating an atmosphere. For this template, we wanted something that felt premium, modern, and highly editorial. Enter the "Kitsune Stack" aesthetic.

![Dark Mode UI Design](https://images.unsplash.com/photo-1618761714954-0b8cd0026356?q=80&w=2070&auto=format&fit=crop)

## The Palette

We moved away from pure blacks (\`#000000\`) which can be harsh on high-contrast displays. Instead, we use rich, deep neutrals (\`#0A0A0A\`) layered with translucent whites (\`white/[0.02]\`).

The accent colors are where the magic happens:
- **Metallic Gold (\`#D9AB72\`)**: Premium accents, primary highlights, active states.
- **Technical Teal (\`#5FD1C4\`)**: Code blocks, success states, terminal vibes.

## Refined Spacing & Typography

We rely heavily on serif fonts for headings (like *Merriweather* or standard OS serifs) paired with modern sans-serifs for body copy. This contrast provides an "editorial-tech" feel. 

Instead of heavy box-shadows, we use subtle 1px inner borders (\`ring-1 ring-white/10\`) and \`backdrop-blur\` to separate layered elements.

## Micro-interactions

Static interfaces are boring. We use [Motion](https://motion.dev/) to add life. Buttons scale slightly on press. Cards lift on hover with glowing metallic borders. These micro-interactions make the application feel responsive and alive.`,
      published: true,
    },
    {
      title: 'Deploying Monorepos to Vercel and Railway',
      slug: 'deploying-monorepos',
      content: `Deployment can often be the hardest part of building a full-stack application, especially when multiple moving parts are involved. In this guide, we'll walk through how to deploy the Kitsune Stack to production.

![Server Racks](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop)

## The Frontend (Vercel)

Vercel has native support for Turborepo. Simply import your GitHub repository, and Vercel will automatically detect the Next.js app in \`apps/web\`.
Ensure your Build Command is set to \`bun run build\` and the Install Command is \`bun install\`.

## The Backend (Railway)

For the Express server (\`apps/server\`) and the background worker (\`apps/worker\`), Railway is an excellent choice.

1. Connect your repository to Railway.
2. Setup a PostgreSQL database and a Redis instance directly within your Railway project.
3. Deploy two distinct services pointing to your repository, changing the Root Directory and start commands respectively.

\`\`\`bash
# Start Server
cd apps/server && bun start

# Start Worker
cd apps/worker && bun start
\`\`\`

By separating these concerns, you get cheap, infinitely scalable serverless frontends while maintaining a robust, stateful backend infrastructure!`,
      published: true,
    },
  ]

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        content: post.content,
        title: post.title,
      },
      create: {
        ...post,
        authorId: user.id,
      },
    })
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
