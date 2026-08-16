# HireSense API

NestJS backend for HireSense — authentication, recruitment domain, file storage, and orchestration of the AI service.

## Stack

- NestJS 11 + TypeScript
- Prisma 7 on PostgreSQL 18 + pgvector
- JWT authentication (argon2 password hashing, access + refresh tokens)
- class-validator / class-transformer DTO validation

## Module layout

```text
src/
├── config/
├── common/
├── infrastructure/
│   ├── database/        # PrismaService + driver adapter
│   ├── storage/         # pluggable storage providers (incl. Discord-backed)
│   ├── ai/              # client for the FastAPI AI service
│   └── queue/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── candidates/
│   ├── recruiters/
│   ├── companies/
│   ├── skills/
│   ├── files/
│   ├── resumes/
│   ├── jobs/
│   ├── applications/
│   └── matching/
└── generated/
    └── prisma/          # generated Prisma client (do not edit)
```

Dependency direction and domain rules are documented in [`BACKEND_STRUCTURE.md`](BACKEND_STRUCTURE.md). The database schema is defined in [`prisma/`](prisma/) — see [`../../docs/DATABASE.md`](../../docs/DATABASE.md) for the full architecture guide.

## Commands

Run from the repository root (or here with the same names):

```bash
pnpm start:dev           # watch mode (root: pnpm dev:api)
pnpm build               # production build
pnpm lint                # ESLint
pnpm typecheck           # tsc --noEmit
pnpm test                # Jest unit tests
pnpm test:e2e            # Jest e2e tests

pnpm prisma:generate     # generate the Prisma client
pnpm prisma:migrate:dev  # create/apply migrations in development
pnpm prisma:migrate      # prisma migrate deploy
```

## Environment

See the root [`.env.example`](../../.env.example). Key variables: `PORT`, `DATABASE_URL`, `AI_SERVICE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
