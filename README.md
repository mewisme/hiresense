# HireSense

**AI-assisted recruitment platform with CV–job matching.**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-mewisme%2Fhiresense-181717.svg?logo=github)](https://github.com/mewisme/hiresense)

HireSense is a recruitment system that turns CVs and job descriptions into structured data and scores how well a candidate fits a job. It supports the full hiring flow — recruiters publish jobs, candidates upload CVs and apply, and the system parses each CV and computes an explainable match score (skills, experience, education) that recruiters use to review and rank applicants. AI supports the decision; the recruiter always makes it.

> Đề tài: _Xây dựng hệ thống tuyển dụng và phân tích mức độ phù hợp giữa CV và mô tả công việc ứng dụng trí tuệ nhân tạo_ — a graduation project developed in phases: internship MVP → full recruitment product → semantic matching platform (embeddings, ranking, recommendation, explainability).

## Highlights

- **Versioned everything that matters** — jobs, resumes, and every AI run are versioned. An application permanently keeps the exact job version and resume version it was evaluated against, so any match score can be reproduced later.
- **PostgreSQL-first AI data layer** — one PostgreSQL 18 + pgvector instance is the single source of truth; vector/embedding data is derived and rebuildable rather than duplicated in a separate vector database.
- **Explainable matching** — scores come with a breakdown (skill / experience / education components), matched and missing skills, and evidence, not just a number.
- **Pluggable file storage** — CVs are stored behind a storage abstraction with a Discord-backed chunked, content-addressed provider; business modules only ever reference `file_objects`.

## Tech stack

| Layer      | Technology                                                      |
| ---------- | --------------------------------------------------------------- |
| Web        | Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript   |
| API        | NestJS 11, Prisma 7, JWT auth (argon2 hashing), class-validator |
| AI service | FastAPI (Python 3.14, managed by uv), Pydantic                  |
| Database   | PostgreSQL 18 + pgvector, UUIDv7 primary keys, UTC timestamps   |
| Tooling    | pnpm workspaces, ESLint, Prettier, Jest, Docker Compose         |

## Repository structure

```text
hiresense/
├── apps/
│   ├── web/                  # Next.js frontend
│   ├── api/                  # NestJS + Prisma backend
│   │   └── src/
│   │       ├── modules/      # auth, users, candidates, recruiters, companies,
│   │       │                 # skills, files, resumes, jobs, applications, matching
│   │       ├── infrastructure/ # database (Prisma), storage, ai client, queue
│   │       ├── common/       # shared guards, filters, decorators
│   │       └── config/
│   └── ai/                   # FastAPI service (parsers, matching, embeddings)
├── packages/
│   ├── types/                # shared TypeScript types
│   ├── eslint-config/
│   └── tsconfig/
├── docs/                     # architecture, demo, matching, acceptance, security
├── plans/                    # graduation project plans (VI/EN)
├── compose.yaml              # Docker Compose (profiles: dev, prod)
└── .env.example
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 20 and [pnpm](https://pnpm.io) 12.x (`corepack enable`; repo pins `pnpm@12.3.4`)
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Python](https://www.python.org) 3.14 with [uv](https://docs.astral.sh/uv/) (for the AI service)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

`COMPOSE_PROFILES=dev` in the root `.env` makes Compose use the **dev** profile by default.

Then review the values — at minimum change the JWT secrets for anything beyond local development:

| Variable              | Purpose                          | Default                                                   |
| --------------------- | -------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string     | `postgresql://postgres:postgres@localhost:5432/hiresense` |
| `PORT`                | API port                         | `4000`                                                    |
| `AI_SERVICE_URL`      | FastAPI base URL used by the API | `http://localhost:8000`                                   |
| `JWT_ACCESS_SECRET`   | Access token signing secret      | `change-me-access`                                        |
| `JWT_REFRESH_SECRET`  | Refresh token signing secret     | `change-me-refresh`                                       |
| `NEXT_PUBLIC_API_URL` | API base URL used by the web app | `http://localhost:4000`                                   |

### 3. Start Postgres (Compose profile `dev`)

```bash
pnpm compose:dev
# same as: docker compose --profile dev up -d
```

Profiles:

| Profile | What runs in Docker                      | What runs on the host                         |
| ------- | ---------------------------------------- | --------------------------------------------- |
| `dev`   | Postgres only                            | `pnpm dev:web`, `pnpm dev:api`, `pnpm dev:ai` |
| `prod`  | Postgres (app containers can join later) | —                                             |

**Web is not containerized under `dev`** — keep Next.js on the host for hot reload (`pnpm dev:web`).

This starts PostgreSQL 18 with pgvector. Required extensions (`vector`, `pg_trgm`, `unaccent`, `citext`, `pgcrypto`, `btree_gist`) are enabled by the foundation migration.

### 4. Apply database migrations

```bash
pnpm prisma:generate        # generate the Prisma client
pnpm prisma:migrate:dev     # apply migrations in development
pnpm prisma:seed            # deterministic demo users/company/job/skills
```

For production-style deployments use `pnpm prisma:migrate` (runs `prisma migrate deploy`).

Demo accounts (password `Password123!`):

- `recruiter@demo.hiresense.local`
- `candidate@demo.hiresense.local`

Seed provisions a synthetic **Demo CV**, parsed structured rows, published Full-stack Engineer job, and an Applied-stage application ready for recruiter-triggered analysis. Source fixtures live under `apps/api/test/fixtures/demo/`.

### 5. Run the services on the host

Each in its own terminal:

```bash
pnpm dev:api                # NestJS API on http://localhost:4000
pnpm dev:ai                 # FastAPI AI on http://localhost:8000
pnpm dev:web                # Next.js web on http://localhost:3000 (HMR)
```

Follow the Candidate → Recruiter → Candidate script in [`docs/DEMO.md`](docs/DEMO.md).

## Quality checks

```bash
pnpm lint         # ESLint across the workspace
pnpm typecheck    # TypeScript, no emit
pnpm test         # Jest / package tests
pnpm build        # build all packages and apps
pnpm format       # Prettier (also format:check)
pnpm --filter @hiresense/web qa:desktop   # desktop Playwright checkpoint
```

Acceptance checklist: [`docs/ACCEPTANCE_V1.md`](docs/ACCEPTANCE_V1.md).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — as-built Internship V1 architecture
- [`docs/DATABASE.md`](docs/DATABASE.md) — database architecture and evolution guide
- [`docs/API.md`](docs/API.md) — API path index + Hoppscotch collections
- [`docs/DEMO.md`](docs/DEMO.md) — seeded accounts + Internship V1 demo script
- [`docs/MATCHING_V1.md`](docs/MATCHING_V1.md) — baseline formula, trigger rules, limitations
- [`docs/SECURITY.md`](docs/SECURITY.md) — authorization and privacy notes
- [`docs/QUALITY.md`](docs/QUALITY.md) — latest quality-gate snapshot
- [`docs/ACCEPTANCE_V1.md`](docs/ACCEPTANCE_V1.md) — Internship V1 acceptance checklist
- [`docs/WEB_UI_DESKTOP_CHECKPOINT.md`](docs/WEB_UI_DESKTOP_CHECKPOINT.md) — accepted desktop UI checkpoint
- [`apps/api/BACKEND_STRUCTURE.md`](apps/api/BACKEND_STRUCTURE.md) — backend module layout
- [`apps/api/prisma/README.md`](apps/api/prisma/README.md) — migrations + seed notes
- [`plans/`](plans/) — internship / graduation plans (local working copies)

## Project phases

1. **Phase I — Graduation Internship (Baseline V1)** — end-to-end Candidate/Recruiter flow with deterministic CV parsing and explainable skill/experience/education matching. Admin and semantic AI are out of scope.
2. **Phase II — Final graduation project** — semantic/hybrid matching, ranking, recommendation, richer explainability, and evaluation against the frozen V1 baseline.

## License

Copyright 2026 Nguyễn Mậu Minh

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for the full license text.
