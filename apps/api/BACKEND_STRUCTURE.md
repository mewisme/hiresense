# HireSense NestJS Backend Structure

Repository utility scripts live in `hiresense/scripts/`.

```text
src/
├── config/
├── common/
├── infrastructure/
│   ├── database/
│   ├── storage/
│   ├── ai/
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
    └── prisma/
```

Dependency direction:

```text
Controller
  -> Service
  -> Repository
  -> PrismaService
  -> PostgreSQL

Service
  -> AiClientService
  -> FastAPI
```

Rules:

- Controllers do not access Prisma directly.
- Published JobVersion is immutable.
- ResumeVersion used by an Application is historical data.
- Application always keeps exact JobVersion and ResumeVersion.
- AI results are run/version based.
- Prisma-generated code remains under `src/generated/prisma`.
- PostgreSQL-specific rules remain in SQL migrations.
