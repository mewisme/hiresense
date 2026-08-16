# HireSense

**AI-assisted recruitment platform with CV–job matching.**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-mewisme%2Fhiresense-181717.svg?logo=github)](https://github.com/mewisme/hiresense)

HireSense is a recruitment system that turns CVs and job descriptions into structured data and scores how well a candidate fits a job. It supports the full hiring flow — recruiters publish jobs, candidates upload CVs and apply, and the system parses each CV and computes an explainable match score (skills, experience, education) that recruiters use to review and rank applicants. AI supports the decision; the recruiter always makes it.

> Đề tài: *Xây dựng hệ thống tuyển dụng và phân tích mức độ phù hợp giữa CV và mô tả công việc ứng dụng trí tuệ nhân tạo* — a graduation project developed in phases: internship MVP → full recruitment product → semantic matching platform (embeddings, ranking, recommendation, explainability).

## Highlights

- **Versioned everything that matters** — jobs, resumes, and every AI run are versioned. An application permanently keeps the exact job version and resume version it was evaluated against, so any match score can be reproduced later.
- **PostgreSQL-first AI data layer** — one PostgreSQL 18 + pgvector instance is the single source of truth; vector/embedding data is derived and rebuildable rather than duplicated in a separate vector database.
- **Explainable matching** — scores come with a breakdown (skill / experience / education components), matched and missing skills, and evidence, not just a number.
- **Pluggable file storage** — CVs are stored behind a storage abstraction with a Discord-backed chunked, content-addressed provider; business modules only ever reference `file_objects`.

## Tech stack

| Layer     | Technology                                                                  |
| --------- | --------------------------------------------------------------------------- |
| Web       | Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript               |
| API       | NestJS 11, Prisma 7, JWT auth (argon2 hashing), class-validator            |
| AI service | FastAPI (Python 3.14, managed by uv), Pydantic                             |
| Database  | PostgreSQL 18 + pgvector, UUIDv7 primary keys, UTC timestamps              |
| Tooling   | pnpm workspaces, ESLint, Prettier, Jest, Docker Compose                    |

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
├── docs/
│   └── DATABASE.md           # database architecture — source of truth
├── plans/                    # graduation project plans (VI/EN)
├── compose.yaml              # PostgreSQL 18 + pgvector
└── .env.example
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 20 and [pnpm](https://pnpm.io) 11.x (`corepack enable`)
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Python](https://www.python.org) 3.14 with [uv](https://docs.astral.sh/uv/) (for the AI service)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then review the values — at minimum change the JWT secrets for anything beyond local development:

| Variable              | Purpose                                | Default                                        |
| --------------------- | -------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string           | `postgresql://postgres:postgres@localhost:5432/hiresense` |
| `PORT`                | API port                               | `4000`                                         |
| `AI_SERVICE_URL`      | FastAPI base URL used by the API       | `http://localhost:8000`                        |
| `JWT_ACCESS_SECRET`   | Access token signing secret            | `change-me`                                    |
| `JWT_REFRESH_SECRET`  | Refresh token signing secret           | `change-me`                                    |
| `NEXT_PUBLIC_API_URL` | API base URL used by the web app       | `http://localhost:4000`                        |
| `AI_HOST` / `AI_PORT` | FastAPI bind address                   | `0.0.0.0` / `8000`                             |

### 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL 18 with pgvector and the required extensions (`vector`, `pg_trgm`, `unaccent`, `citext`, `pgcrypto`, `btree_gist`) are enabled by the foundation migration.

### 4. Apply database migrations

```bash
pnpm prisma:generate        # generate the Prisma client
pnpm prisma:migrate:dev     # apply migrations in development
```

For production-style deployments use `pnpm prisma:migrate` (runs `prisma migrate deploy`).

### 5. Run the services

Each in its own terminal:

```bash
pnpm dev:api                # NestJS API on http://localhost:4000

pnpm dev:web                # Next.js web on http://localhost:3000

cd apps/ai
uv run uvicorn app.main:app --reload --port 8000   # FastAPI AI service
```

## Quality checks

```bash
pnpm lint         # ESLint across the workspace
pnpm typecheck    # TypeScript, no emit
pnpm test         # Jest unit tests
pnpm build        # build all packages and apps
pnpm format       # Prettier (also format:check)
```

## Documentation

- [`docs/DATABASE.md`](docs/DATABASE.md) — database architecture and evolution guide (source of truth for the schema, conventions, and phase roadmap)
- [`apps/api/BACKEND_STRUCTURE.md`](apps/api/BACKEND_STRUCTURE.md) — backend module layout and dependency rules
- [`plans/`](plans/) — detailed internship and final graduation project plans (Vietnamese and English)

## Project phases

1. **Internship (MVP)** — end-to-end recruitment flow with baseline CV parsing and CV–JD matching (skill/experience/education scoring).
2. **V1 — Recruitment product** — skill taxonomy and aliases, structured requirements, interviews, notifications, audit, fuzzy/full-text search.
3. **V2 — Intelligent matching** — pgvector embeddings, semantic and hybrid matching, candidate ranking, job recommendation, and explainable AI, with every AI result tied to an exact content + model + pipeline version.

## License

Copyright 2026 Nguyễn Mậu Minh

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for the full license text.
