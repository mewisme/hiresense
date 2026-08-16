# HireSense

AI-assisted recruitment and CV-job matching platform.

## Project structure

```text
hiresense/
├── apps/
│   ├── web/              # Next.js
│   ├── api/              # NestJS + Prisma
│   └── ai/               # FastAPI
├── packages/
│   ├── types/
│   ├── eslint-config/
│   └── tsconfig/
├── docs/
├── compose.yaml
├── package.json
└── pnpm-workspace.yaml
```

## Start PostgreSQL

```powershell
docker compose up -d postgres
```

## Start Web

```powershell
pnpm dev:web
```

## Start API

```powershell
pnpm dev:api
```

## Start AI

```powershell
cd apps/ai
uv run uvicorn app.main:app --reload --port 8000
```

## Quality checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## pnpm dependency build policy

Default: `approve-current`.

During bootstrap, pnpm uses `strictDepBuilds: false` so framework scaffolding can finish.
After the full dependency graph is installed, the script approves the currently pending build scripts, rebuilds them, then restores `strictDepBuilds: true` for future installs.

Available overrides:

- `approve-current`: recommended; approve only the dependency build scripts present during bootstrap, then return to strict mode.
- `warn`: keep unapproved build scripts blocked but do not fail installation.
- `strict`: fail immediately when pnpm encounters an unreviewed dependency build script.

## Dependency policy

- New JavaScript dependencies are installed from latest stable releases.
- Alpha, beta, RC, canary and preview versions are avoided by default.
- Commit `pnpm-lock.yaml` and `apps/ai/uv.lock`.
- Python uses the latest maintenance release in the 3.14 stable line.
- PostgreSQL uses the version selected by `-PostgresVersion`.

## Bootstrap versions

- TypeScript: configurable; default is 6.x
- Next.js: configurable; default is latest stable
- NestJS CLI: configurable; default is latest stable
- Prisma: configurable; default is latest stable
- Python: configurable; default is 3.14
- PostgreSQL: configurable; default is 18.6

## Override examples

```powershell
pwsh ./init.ps1 -TypeScriptVersion "6.0.3"
pwsh ./init.ps1 -PythonVersion "3.14" -PostgresVersion "18.6"
pwsh ./init.ps1 -NextVersion "latest" -NestCliVersion "latest"
pwsh ./init.ps1 -Force
pwsh ./init.ps1 -DependencyBuildPolicy "approve-current"
pwsh ./init.ps1 -DependencyBuildPolicy "warn"
pwsh ./init.ps1 -DependencyBuildPolicy "strict"
```
