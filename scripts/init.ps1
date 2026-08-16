#requires -Version 7.0
<#
HireSense bootstrap script.
Script version: 2026.08.16.3
Place this file inside the HireSense project folder, then run:

  cd hiresense
  pwsh ./init.ps1

It initializes the current script folder as the project root:
  hiresense/
    apps/web            Next.js + TypeScript
    apps/api            NestJS + TypeScript + Prisma
    apps/ai             FastAPI + Python 3.14 + uv
    packages/types
    packages/eslint-config
    packages/tsconfig

Requirements:
  - PowerShell 7+
  - Node.js
  - Corepack
  - Git
  - Docker (optional, only needed to run PostgreSQL)

Defaults:
  - TypeScript 6.x
  - Next.js latest stable
  - NestJS CLI latest stable
  - Prisma latest stable
  - Python 3.14
  - PostgreSQL 18.6

Examples:
  pwsh ./init.ps1
  pwsh ./init.ps1 -TypeScriptVersion "6.0.3"
  pwsh ./init.ps1 -PythonVersion "3.14" -PostgresVersion "18.6"
  pwsh ./init.ps1 -Force
#>

[CmdletBinding()]
param(
    [string]$TypeScriptVersion = "6",
    [string]$NextVersion = "latest",
    [string]$NestCliVersion = "latest",
    [string]$PrismaVersion = "latest",
    [string]$PnpmVersion = "latest",
    [string]$PythonVersion = "3.14",
    [string]$PostgresVersion = "18.6",
    [int]$NodeMinMajor = 24,
    [ValidateSet("approve-current", "warn", "strict")]
    [string]$DependencyBuildPolicy = "approve-current",
    [switch]$SkipAi,
    [switch]$SkipInstall,
    [switch]$SkipGit,
    [Alias("Overwrite")]
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ScriptVersion = "2026.08.16.3"
Write-Host "HireSense init.ps1 v$ScriptVersion" -ForegroundColor Magenta

function Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Ok([string]$Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Warn([string]$Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Require-Command {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [string]$Hint = ""
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        $message = "Required command '$Name' was not found."
        if ($Hint) { $message += " $Hint" }
        throw $message
    }
}

function Run {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')"
    }
}

function Write-Text {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content
    )

    $parent = Split-Path -Parent $Path
    if ($parent -and -not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    [System.IO.File]::WriteAllText(
        $Path,
        $Content.TrimStart() + [Environment]::NewLine,
        [System.Text.UTF8Encoding]::new($false)
    )
}

function Save-Json {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][System.Collections.IDictionary]$Object
    )

    $json = $Object | ConvertTo-Json -Depth 100
    Write-Text -Path $Path -Content $json
}

function Read-JsonHashtable([string]$Path) {
    return Get-Content $Path -Raw | ConvertFrom-Json -AsHashtable
}

$ProjectRoot = $PSScriptRoot
$ProjectName = Split-Path -Leaf $ProjectRoot

Step "Checking prerequisites"
Require-Command node "Install a current Node.js release first."
Require-Command git "Install Git first."

$nodeVersion = (node --version).Trim()
$nodeMajor = [int](($nodeVersion -replace '^v', '').Split('.')[0])
if ($nodeMajor -lt $NodeMinMajor) {
    throw "Node.js $NodeMinMajor+ is required. Detected: $nodeVersion"
}
Ok "Node.js $nodeVersion"

if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
    Require-Command npm "npm is required to install Corepack."
    Step "Installing latest Corepack"
    Run npm install "--global" "corepack@latest"
}

Step "Enabling Corepack and pnpm $PnpmVersion"
Run corepack enable
Run corepack prepare "pnpm@$PnpmVersion" "--activate"
Require-Command pnpm
$pnpmVersion = (pnpm --version).Trim()
Ok "pnpm $pnpmVersion"
Write-Host "Dependency build policy: $DependencyBuildPolicy" -ForegroundColor DarkGray

if (-not $SkipAi) {
    if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
        Warn "uv is not installed."

        if ($IsWindows) {
            Step "Installing latest uv"
            Invoke-RestMethod "https://astral.sh/uv/install.ps1" | Invoke-Expression
            $env:Path = "$HOME\.local\bin;$HOME\.cargo\bin;$env:Path"
        }
        else {
            throw "uv is required for apps/ai. Install uv or rerun with -SkipAi."
        }
    }

    Require-Command uv "Install uv or rerun with -SkipAi."
    Ok ((uv --version).Trim())
}

Step "Using script folder as project root"
Ok "Project root: $ProjectRoot"

$generatedPaths = @(
    "$ProjectRoot/apps/web",
    "$ProjectRoot/apps/api",
    "$ProjectRoot/packages/types",
    "$ProjectRoot/packages/eslint-config",
    "$ProjectRoot/packages/tsconfig"
)
if (-not $SkipAi) { $generatedPaths += "$ProjectRoot/apps/ai" }

$existingGenerated = @($generatedPaths | Where-Object { Test-Path $_ })
$rootAlreadyInitialized = (Test-Path "$ProjectRoot/package.json") -or (Test-Path "$ProjectRoot/pnpm-workspace.yaml")

if (($rootAlreadyInitialized -or $existingGenerated.Count -gt 0) -and -not $Force) {
    throw "This folder already appears to be initialized. Re-run with -Force to replace generated HireSense bootstrap files."
}

if ($Force) {
    foreach ($generatedPath in $existingGenerated) {
        Warn "Removing generated path: $generatedPath"
        Remove-Item -Recurse -Force $generatedPath
    }

    foreach ($bootstrapArtifact in @(
        "$ProjectRoot/node_modules",
        "$ProjectRoot/pnpm-lock.yaml"
    )) {
        if (Test-Path $bootstrapArtifact) {
            Warn "Removing stale bootstrap artifact: $bootstrapArtifact"
            Remove-Item -Recurse -Force $bootstrapArtifact
        }
    }
}

Set-Location $ProjectRoot
New-Item -ItemType Directory -Path "apps", "packages", "docs" -Force | Out-Null

Step "Creating pnpm workspace"
Save-Json -Path "$ProjectRoot/package.json" -Object ([ordered]@{
    name = "@hiresense/root"
    version = "0.0.0"
    private = $true
    packageManager = "pnpm@$pnpmVersion"
    scripts = [ordered]@{
        "dev:web" = "pnpm --filter @hiresense/web dev"
        "dev:api" = "pnpm --filter @hiresense/api start:dev"
        "build" = "pnpm -r --if-present build"
        "lint" = "pnpm -r --if-present lint"
        "typecheck" = "pnpm -r --if-present typecheck"
        "test" = "pnpm -r --if-present test"
        "format" = "prettier --write ."
        "format:check" = "prettier --check ."
        "ts:version" = "tsc --version"
    }
    devDependencies = [ordered]@{
        eslint = "latest"
        prettier = "latest"
        typescript = $TypeScriptVersion
    }
})

$initialStrictDepBuilds = if ($DependencyBuildPolicy -eq "strict") { "true" } else { "false" }

Write-Text "$ProjectRoot/pnpm-workspace.yaml" @"
packages:
  - "apps/*"
  - "packages/*"
strictDepBuilds: $initialStrictDepBuilds
"@

Write-Text "$ProjectRoot/.gitignore" @'
node_modules/
.pnpm-store/
.next/
dist/
coverage/

__pycache__/
*.py[cod]
.venv/
.pytest_cache/
.ruff_cache/

.env
.env.*
!.env.example

.vscode/
.idea/
.DS_Store
Thumbs.db
*.log
'@

Write-Text "$ProjectRoot/.prettierignore" @'
node_modules
.pnpm-store
.next
dist
coverage
.venv
pnpm-lock.yaml
uv.lock
'@

Write-Text "$ProjectRoot/.prettierrc.json" @'
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
'@

Write-Text "$ProjectRoot/.env.example" @'
NEXT_PUBLIC_API_URL=http://localhost:4000

PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hiresense
AI_SERVICE_URL=http://localhost:8000
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me

AI_HOST=0.0.0.0
AI_PORT=8000
'@

Step "Creating shared tsconfig package"
$tsDir = "$ProjectRoot/packages/tsconfig"
New-Item -ItemType Directory -Path $tsDir -Force | Out-Null

Save-Json "$tsDir/package.json" ([ordered]@{
    name = "@hiresense/tsconfig"
    version = "0.0.0"
    private = $true
    files = @("*.json")
})

Write-Text "$tsDir/base.json" @'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "noFallthroughCasesInSwitch": true
  }
}
'@

Write-Text "$tsDir/nextjs.json" @'
{
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "isolatedModules": true,
    "plugins": [{ "name": "next" }]
  }
}
'@

Write-Text "$tsDir/nestjs.json" @'
{
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "incremental": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false
  }
}
'@

Step "Creating shared ESLint config package"
$eslintDir = "$ProjectRoot/packages/eslint-config"
New-Item -ItemType Directory -Path $eslintDir -Force | Out-Null

Save-Json "$eslintDir/package.json" ([ordered]@{
    name = "@hiresense/eslint-config"
    version = "0.0.0"
    private = $true
    type = "module"
    exports = [ordered]@{
        "./base" = "./base.mjs"
        "./next" = "./next.mjs"
        "./nest" = "./nest.mjs"
    }
    dependencies = [ordered]@{
        "@eslint/js" = "latest"
        "eslint-config-next" = "latest"
        "eslint-config-prettier" = "latest"
        "typescript-eslint" = "latest"
        typescript = $TypeScriptVersion
    }
    peerDependencies = [ordered]@{
        eslint = ">=9"
    }
})

Write-Text "$eslintDir/base.mjs" @'
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
    ],
  },
];
'@

Write-Text "$eslintDir/next.mjs" @'
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

export default [
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];
'@

Write-Text "$eslintDir/nest.mjs" @'
import base from './base.mjs';

export default [
  ...base,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
'@

Step "Creating shared public types package"
$typesDir = "$ProjectRoot/packages/types"
New-Item -ItemType Directory -Path "$typesDir/src" -Force | Out-Null

Save-Json "$typesDir/package.json" ([ordered]@{
    name = "@hiresense/types"
    version = "0.0.0"
    private = $true
    type = "module"
    main = "./dist/index.js"
    types = "./dist/index.d.ts"
    exports = [ordered]@{
        "." = [ordered]@{
            types = "./dist/index.d.ts"
            default = "./dist/index.js"
        }
    }
    scripts = [ordered]@{
        build = "tsc -p tsconfig.json"
        typecheck = "tsc --noEmit"
    }
    devDependencies = [ordered]@{
        "@hiresense/tsconfig" = "workspace:*"
        typescript = $TypeScriptVersion
    }
})

Write-Text "$typesDir/tsconfig.json" @'
{
  "extends": "@hiresense/tsconfig/base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
'@

Write-Text "$typesDir/src/job.ts" @'
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}
'@

Write-Text "$typesDir/src/application.ts" @'
export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'ACCEPTED'
  | 'REJECTED';

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
}
'@

Write-Text "$typesDir/src/ai.ts" @'
export interface MatchScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  semantic?: number;
}

export interface MatchResult {
  overallScore: number;
  breakdown: MatchScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  version: string;
}
'@

Write-Text "$typesDir/src/index.ts" @'
export * from './job.js';
export * from './application.js';
export * from './ai.js';
'@

Step "Scaffolding Next.js $NextVersion"
Push-Location "$ProjectRoot/apps"
try {
    $args = @(
        "create", "next-app@$NextVersion", "web",
        "--ts", "--eslint", "--tailwind", "--src-dir", "--app",
        "--turbopack", "--import-alias", "@/*", "--use-pnpm", "--yes"
    )
    if ($SkipInstall) { $args += "--skip-install" }
    Run pnpm @args
}
finally {
    Pop-Location
}

$webPackagePath = "$ProjectRoot/apps/web/package.json"
$webPackage = Read-JsonHashtable $webPackagePath
$webPackage.name = "@hiresense/web"
$webPackage.dependencies["@hiresense/types"] = "workspace:*"
$webPackage.devDependencies["@hiresense/eslint-config"] = "workspace:*"
$webPackage.devDependencies["@hiresense/tsconfig"] = "workspace:*"
$webPackage.devDependencies["typescript"] = $TypeScriptVersion
$webPackage.scripts["lint"] = "eslint ."
$webPackage.scripts["typecheck"] = "tsc --noEmit"
$webPackage.scripts["ts:version"] = "tsc --version"
Save-Json $webPackagePath $webPackage

Write-Text "$ProjectRoot/apps/web/eslint.config.mjs" @'
import config from '@hiresense/eslint-config/next';
export default config;
'@

Write-Text "$ProjectRoot/apps/web/tsconfig.json" @'
{
  "extends": "@hiresense/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
'@

Step "Scaffolding NestJS CLI $NestCliVersion"
Push-Location "$ProjectRoot/apps"
try {
    $args = @(
        "dlx", "@nestjs/cli@$NestCliVersion", "new", "api",
        "--package-manager", "pnpm", "--skip-git", "--strict"
    )
    if ($SkipInstall) { $args += "--skip-install" }
    Run pnpm @args
}
finally {
    Pop-Location
}

$apiPackagePath = "$ProjectRoot/apps/api/package.json"
$apiPackage = Read-JsonHashtable $apiPackagePath
$apiPackage.name = "@hiresense/api"
$apiPackage.dependencies["@hiresense/types"] = "workspace:*"
$apiPackage.devDependencies["@hiresense/eslint-config"] = "workspace:*"
$apiPackage.devDependencies["@hiresense/tsconfig"] = "workspace:*"
$apiPackage.devDependencies["typescript"] = $TypeScriptVersion
$apiPackage.scripts["lint"] = "eslint ."
$apiPackage.scripts["typecheck"] = "tsc --noEmit"
$apiPackage.scripts["ts:version"] = "tsc --version"
Save-Json $apiPackagePath $apiPackage

Write-Text "$ProjectRoot/apps/api/eslint.config.mjs" @'
import config from '@hiresense/eslint-config/nest';
export default config;
'@

Write-Text "$ProjectRoot/apps/api/tsconfig.json" @'
{
  "extends": "@hiresense/tsconfig/nestjs.json",
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
'@

if (-not $SkipInstall) {
    Step "Installing Prisma $PrismaVersion"
    Push-Location "$ProjectRoot/apps/api"
    try {
        Run pnpm add "@prisma/client@$PrismaVersion"
        Run pnpm add "-D" "prisma@$PrismaVersion"
        Run pnpm exec prisma init "--datasource-provider" "postgresql"
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipAi) {
    Step "Scaffolding FastAPI with Python $PythonVersion"
    Run uv python install $PythonVersion

    Push-Location "$ProjectRoot/apps"
    try {
        Run uv init ai "--python" $PythonVersion "--app"
    }
    finally {
        Pop-Location
    }

    Push-Location "$ProjectRoot/apps/ai"
    try {
        Run uv add fastapi "uvicorn[standard]" pydantic pydantic-settings httpx

        New-Item -ItemType Directory -Path `
            "app", "app/api", "app/core", "app/parsers", "app/matching", `
            "app/embeddings", "tests" -Force | Out-Null

        Write-Text "$ProjectRoot/apps/ai/app/__init__.py" ""
        Write-Text "$ProjectRoot/apps/ai/app/main.py" @'
from fastapi import FastAPI

app = FastAPI(title="HireSense AI", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
'@
    }
    finally {
        Pop-Location
    }
}

Step "Creating PostgreSQL $PostgresVersion Compose service"
Write-Text "$ProjectRoot/compose.yaml" @"
services:
  postgres:
    image: postgres:$PostgresVersion
    container_name: hiresense-postgres
    environment:
      POSTGRES_DB: hiresense
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - hiresense_postgres_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d hiresense"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  hiresense_postgres_data:
"@

Write-Text "$ProjectRoot/README.md" @'
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
'@

if (-not $SkipInstall) {
    Step "Installing workspace dependencies"
    Set-Location $ProjectRoot
    Run pnpm install

    if ($DependencyBuildPolicy -eq "approve-current") {
        Step "Approving build scripts for the currently resolved dependency graph"
        Run pnpm approve-builds --all

        Step "Rebuilding dependencies whose install scripts were just approved"
        Run pnpm rebuild

        Step "Re-enabling strict dependency build protection for future installs"
        Run pnpm config set --location=project --json strictDepBuilds true
    }
    elseif ($DependencyBuildPolicy -eq "warn") {
        Warn "Dependency build scripts remain unapproved. pnpm will warn instead of failing because strictDepBuilds=false."
    }
    else {
        Ok "Strict dependency build protection remained enabled during bootstrap."
    }

    Step "Verifying TypeScript compiler"

    $tsVersionOutput = @(& pnpm exec tsc --version 2>&1)
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to execute TypeScript compiler version check."
    }

    $resolvedTsVersion = $tsVersionOutput |
        ForEach-Object { $_.ToString().Trim() } |
        Where-Object { $_ -match '^Version\s+\d+\.\d+\.\d+' } |
        Select-Object -Last 1

    if (-not $resolvedTsVersion) {
        $rawTsOutput = ($tsVersionOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
        throw "Could not parse TypeScript version from output:`n$rawTsOutput"
    }

    Ok $resolvedTsVersion

    if ($TypeScriptVersion -eq "6" -and $resolvedTsVersion -notmatch '^Version\s+6\.') {
        throw "Expected TypeScript 6.x, but resolved: $resolvedTsVersion"
    }

    Step "Building shared types"
    Run pnpm "--filter" "@hiresense/types" build
}

if (-not $SkipGit) {
    Step "Initializing Git"
    Set-Location $ProjectRoot
    if (-not (Test-Path "$ProjectRoot/.git")) {
        Run git init
    }
}

Ok "HireSense initialized successfully."
Write-Host ""
Write-Host "Project: $ProjectRoot" -ForegroundColor Green
Write-Host ""
Write-Host "Next commands:" -ForegroundColor Cyan
Write-Host "  cd $ProjectRoot"
Write-Host "  docker compose up -d postgres"
Write-Host "  pnpm dev:web"
Write-Host "  pnpm dev:api"
if (-not $SkipAi) {
    Write-Host "  cd apps/ai"
    Write-Host "  uv run uvicorn app.main:app --reload --port 8000"
}
