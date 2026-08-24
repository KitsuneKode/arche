# Implementation Guide: When to Use Which Doc

> **Note:** For current architecture and deploy paths, prefer [architecture.md](./architecture.md), [deployment-render.md](./deployment-render.md), and root [AGENTS.md](../AGENTS.md). Planning-era docs are in [archive/planning/](./archive/planning/).

This is a **decision tree** for navigating production documentation. Use this to find the right guide for your situation.

## Quick Routing

**Are you...** → **Go to:**

### Getting Started

- Scaffolding a new project? → `template-variants.md` (pick your type) → Get started guide in that variant doc
- Deploying to production for the first time? → [deployment-render.md](./deployment-render.md) + [deployment-env.md](./deployment-env.md)
- Running locally? → `docs/README.md` (repo level) + specific template variant

### Building Features

- Adding a new API endpoint? → `apps/server/src/modules/trpc` + `backend-only.md` (API section)
- Building UI components? → `packages/ui/AGENTS.md` + `frontend-design` skill
- Working with authentication? → `packages/auth/README.md`
- Setting up background jobs? → `apps/worker/README.md` or `backend-only.md` (Job Processing section)
- Storing data? → `packages/store/README.md` (Prisma schema) or variant doc (Convex, MongoDB, etc.)

### Debugging & Optimization

- "Site is slow"? → `troubleshooting.md` (Quick Diagnosis) → `performance-optimization.md` (fix it)
- "Many errors in production"? → `troubleshooting.md` (High Error Rate) → `monitoring-setup.md` (track it)
- "Can't login"? → `troubleshooting.md` (Authentication Issues) → `packages/auth/README.md`
- "Database connection refused"? → `troubleshooting.md` (Database Connection Errors)
- Database too slow? → `troubleshooting.md` (Slow Queries) → `performance-optimization.md` (Query Optimization)

### Scaling & Operations

- Need to handle more users? → `scaling-strategies.md`
- Need monitoring/alerting? → `monitoring-setup.md`
- Building for multiple regions? → `scaling-strategies.md` (Multi-Region Deployment)
- Load testing? → `load-testing.md`
- Performance benchmarks? → `performance-baseline.md`

### Testing

- E2E tests? → `e2e-testing.md`
- Unit tests? → `e2e-testing.md` (Vitest section)
- Load testing? → `load-testing.md`

### Deployment

- First time deploying? → Start here ↓ (read Deployment Checklist)
- Deploying to production? → [deployment.md](./deployment.md) (Path A Vercel or Path B Render)
- Kubernetes? → `deployment-kubernetes.md`
- Docker locally? → `docs/README.md` + `docker-compose.yml`

---

## Conceptual Model

Think of the documentation in **layers**:

```
┌─────────────────────────────────────────────────┐
│  App Layer: Feature Building                     │
│  (Auth, tRPC routers, components, jobs)         │
│  📖 packages/*/README.md, template-variants.md │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│  Runtime Layer: Local Development                │
│  (docker-compose, env vars, npm scripts)        │
│  📖 docs/README.md, docker-compose.yml         │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│  Validation Layer: Testing & Metrics             │
│  (E2E, unit tests, performance baselines)       │
│  📖 e2e-testing.md, performance-baseline.md     │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│  Deployment Layer: Moving to Production          │
│  (Docker build, CI/CD, platforms)               │
│  📖 deployment-*.md                             │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│  Operations Layer: Running in Production         │
│  (Monitoring, scaling, incident response)       │
│  📖 monitoring-setup.md, scaling-strategies.md, │
│      troubleshooting.md                         │
└─────────────────────────────────────────────────┘
```

Each layer has its own docs. **You build** in App → Runtime layers, **then validate** in Testing layer, **then move** to Deployment layer, **then operate** in Operations layer.

---

## Document Dependency Graph

```
START HERE: Choose Template
    ↓
template-variants.md ← (pick: Full Stack, Convex, Standalone, Backend-only)
    ↓
[Dev] Build Features
    ├─→ packages/auth/README.md (auth)
    ├─→ packages/trpc/README.md (API)
    ├─→ packages/ui/AGENTS.md (components)
    ├─→ packages/store/README.md (database)
    └─→ apps/worker/README.md (jobs)
    ↓
[Dev] Local Testing
    ├─→ e2e-testing.md (Playwright)
    └─→ performance-baseline.md (measure)
    ↓
[Ops] First Deployment (read all three)
    ├─→ deployment-checklist.md ← YOU ARE HERE
    ├─→ deployment.md (Path A or Path B)
    └─→ deployment-kubernetes.md (if self-hosted)
    ↓
[Ops] Running in Production
    ├─→ monitoring-setup.md (instrument)
    ├─→ load-testing.md (stress test)
    ├─→ scaling-strategies.md (grow)
    ├─→ performance-optimization.md (tune)
    └─→ troubleshooting.md (fix)
```

---

## Key Docs at a Glance

| Situation               | Duration  | Doc                                              | Key Sections                      |
| ----------------------- | --------- | ------------------------------------------------ | --------------------------------- |
| **Getting started**     | 5 min     | template-variants.md                             | Choose type, read getting started |
| **Build first feature** | 30 min    | packages/\*/README.md                            | Entry points, examples            |
| **Local development**   | 15 min    | docs/README.md                                   | Setup, env vars, npm scripts      |
| **Test locally**        | 20 min    | e2e-testing.md                                   | Run Playwright tests              |
| **First deployment**    | 2 hrs     | deployment-\*                                    | Follow checklist + platform guide |
| **Site is slow**        | 1 hr      | troubleshooting.md → performance-optimization.md | Diagnose → fix                    |
| **Error spike**         | 30 min    | troubleshooting.md → monitoring-setup.md         | Check logs → set up alerts        |
| **Scale for growth**    | 2 hrs     | scaling-strategies.md                            | Add replicas, caching, LB         |
| **Production incident** | Real-time | troubleshooting.md                               | Emergency procedures              |

---

## Architecture at a Glance

**Full Stack (default):**

```
Frontend (Next.js) ← HTTP/WebSocket → Backend (Express)
                                        ↓
                                   tRPC Router
                                        ↓
                                   Database (Prisma)
                                        ↓
                                    PostgreSQL
                                        ↓
                                   Background Jobs (BullMQ)
                                        ↓
                                    Redis
```

**Convex variant:**

```
Frontend (Next.js) ← HTTP/WebSocket → Convex (serverless)
                                        ↓
                                   Convex Database
```

**Standalone Next.js:**

```
Frontend (Next.js with API routes)
    ↓
    ├─→ API Routes (tRPC)
    └─→ Database (Prisma)
```

**Backend-only:**

```
Express Server (tRPC)
    ↓
Database (Prisma)
    ↓
Redis (for queues, caching)
```

---

## Common Workflows

### "I want to build a feature"

1. **Add database schema** (if needed)
   - Edit `packages/store/prisma/schema.prisma`
   - Run `npx prisma migrate dev --name add_feature`
   - Read: `packages/store/README.md`

2. **Add tRPC procedure**
   - Edit `packages/trpc/src/routers/...`
   - Use schema types from Prisma
   - Read: `backend-only.md` (API section)

3. **Add UI component**
   - Edit `apps/web/components/...`
   - Import from `packages/ui` for shared components
   - Read: `packages/ui/AGENTS.md`

4. **Connect with tests**
   - Add E2E test in `tests/e2e/...`
   - Run `npm run test:e2e`
   - Read: `e2e-testing.md`

### "Site is down"

1. **Verify it's actually down**

   ```bash
   curl -I https://api.example.com
   ```

2. **Check logs**

   ```bash
   tail -f logs/error.log
   # or
   docker logs <service>
   ```

3. **Check monitoring**
   - Go to: Sentry.io, DataDog.com
   - Look for: error spike, CPU spike, database down

4. **Fix or rollback**
   - If code: fix → commit → deploy
   - If infra: restart services
   - If data: check database

5. **Read afterward**
   - `troubleshooting.md` (Emergency Procedures)
   - `performance-optimization.md` (prevent regression)

### "I need to scale"

1. **Identify bottleneck**
   - Database? → `scaling-strategies.md` (Database Scaling)
   - API? → `scaling-strategies.md` (Application Layer)
   - Frontend? → `performance-optimization.md` + CDN

2. **Implement solution**
   - Database: add read replicas, connection pooling, sharding
   - API: add load balancer, auto-scaling, caching
   - Frontend: enable CDN, compress images, split bundles

3. **Test changes**
   - Run: `npm run load-test` (from `load-testing.md`)
   - Monitor: `monitoring-setup.md`

4. **Deploy and monitor**
   - Check: `performance-baseline.md` (thresholds)
   - Alert on: `monitoring-setup.md` (thresholds)

---

## Where Each Skill Fits

| Skill                         | When to Use                     | Examples                         |
| ----------------------------- | ------------------------------- | -------------------------------- |
| `context7-mcp`                | Library setup, code examples    | Prisma, Next.js, tRPC            |
| `next-best-practices`         | Building Next.js features       | RSC, data patterns, optimization |
| `shadcn`                      | UI components, styling          | Adding components, customizing   |
| `frontend-design`             | Visual design, UI polish        | Making interfaces beautiful      |
| `make-interfaces-feel-better` | Micro-interactions, animations  | Hover states, transitions        |
| `gsap-react`                  | Complex animations              | Scroll effects, choreography     |
| `turborepo`                   | Monorepo setup, task pipelines  | Adding packages, CI/CD           |
| `vercel-react-best-practices` | Performance optimization        | Bundle size, data fetching       |
| `grill-me`                    | Decision-making, stress-testing | "Should we do X?"                |

---

## Document Maintenance

These docs are meant to **live and grow**. When you:

- **Deploy successfully** → Update [deployment.md](./deployment.md) if the path changes
- **Hit production bug** → Add to `troubleshooting.md`
- **Optimize something** → Add to `performance-optimization.md`
- **Learn from incident** → Add to troubleshooting + monitoring docs
- **Discover new pattern** → Add to `scaling-strategies.md`

Docs that match reality = docs people use.

---

## Next: Go to Deployment

→ Read: [deployment.md](./deployment.md) and [deployment-env.md](./deployment-env.md)
