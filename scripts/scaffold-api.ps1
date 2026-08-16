[CmdletBinding()]
param(
    [string]$ApiPath = "",
    [switch]$Force,
    [switch]$DryRun,
    [switch]$IncludeFuture
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# All HireSense utility scripts live in <repo>/scripts/.
# Resolve the repository root from the script location so the script works
# regardless of the caller's current working directory.
$ScriptRoot = $PSScriptRoot
$ProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $ScriptRoot ".."))

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

function Resolve-ProjectPath([string]$PathValue) {
    if ([string]::IsNullOrWhiteSpace($PathValue)) {
        return [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot "apps/api"))
    }

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return [System.IO.Path]::GetFullPath($PathValue)
    }

    # Relative -ApiPath values are resolved from the HireSense repository root.
    return [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $PathValue))
}

function Ensure-Directory([string]$Path) {
    if ($DryRun) {
        Write-Host "[DRY] mkdir $Path"
        return
    }

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Ok "Created directory: $Path"
    }
}

function Write-ScaffoldFile(
    [string]$Path,
    [string]$Content
) {
    $parent = Split-Path -Parent $Path
    Ensure-Directory $parent

    if (Test-Path -LiteralPath $Path) {
        if (-not $Force) {
            Warn "Skipped existing file: $Path"
            return
        }

        if ($DryRun) {
            Write-Host "[DRY] overwrite $Path"
            return
        }

        Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
        Ok "Overwritten: $Path"
        return
    }

    if ($DryRun) {
        Write-Host "[DRY] create $Path"
        return
    }

    Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
    Ok "Created file: $Path"
}

function To-PascalCase([string]$Value) {
    return (($Value -split '[-_]' | ForEach-Object {
        if ($_.Length -eq 0) { return "" }
        $_.Substring(0,1).ToUpperInvariant() + $_.Substring(1)
    }) -join '')
}

function New-FeatureModule(
    [string]$Name,
    [switch]$WithController = $true,
    [switch]$WithRepository = $true,
    [string[]]$ExtraDirectories = @()
) {
    $moduleRoot = Join-Path $SrcModules $Name
    $className = To-PascalCase $Name
    $singular = $Name.TrimEnd('s')

    Ensure-Directory $moduleRoot
    Ensure-Directory (Join-Path $moduleRoot "dto")

    foreach ($dir in $ExtraDirectories) {
        Ensure-Directory (Join-Path $moduleRoot $dir)
    }

    $imports = @()
    $controllersLine = "controllers: [],"
    $providers = @("${className}Service")
    $exports = @("${className}Service")

    if ($WithController) {
        $imports += "import { ${className}Controller } from './${Name}.controller';"
        $controllersLine = "controllers: [${className}Controller],"
    }

    $imports += "import { ${className}Service } from './${Name}.service';"

    if ($WithRepository) {
        Ensure-Directory (Join-Path $moduleRoot "repositories")
        $repositoryClass = "${className}Repository"
        $imports += "import { ${repositoryClass} } from './repositories/${Name}.repository';"
        $providers += $repositoryClass
        $exports += $repositoryClass

        Write-ScaffoldFile `
            (Join-Path $moduleRoot "repositories/${Name}.repository.ts") `
            @"
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ${repositoryClass} {
  constructor(private readonly prisma: PrismaService) {}
}
"@
    }

    $moduleContent = @"
import { Module } from '@nestjs/common';
$($imports -join "`n")

@Module({
  $controllersLine
  providers: [$($providers -join ', ')],
  exports: [$($exports -join ', ')],
})
export class ${className}Module {}
"@

    Write-ScaffoldFile (Join-Path $moduleRoot "${Name}.module.ts") $moduleContent

    Write-ScaffoldFile `
        (Join-Path $moduleRoot "${Name}.service.ts") `
        @"
import { Injectable } from '@nestjs/common';

@Injectable()
export class ${className}Service {}
"@

    if ($WithController) {
        Write-ScaffoldFile `
            (Join-Path $moduleRoot "${Name}.controller.ts") `
            @"
import { Controller } from '@nestjs/common';

@Controller('${Name}')
export class ${className}Controller {}
"@
    }

    Write-ScaffoldFile (Join-Path $moduleRoot "dto/.gitkeep") ""
}

$ApiRoot = Resolve-ProjectPath $ApiPath
$SrcRoot = Join-Path $ApiRoot "src"
$SrcConfig = Join-Path $SrcRoot "config"
$SrcCommon = Join-Path $SrcRoot "common"
$SrcInfrastructure = Join-Path $SrcRoot "infrastructure"
$SrcModules = Join-Path $SrcRoot "modules"
$TestRoot = Join-Path $ApiRoot "test"

Step "HireSense NestJS backend scaffold"
Write-Host "Script root: $ScriptRoot"
Write-Host "Project root: $ProjectRoot"
Write-Host "API root: $ApiRoot"
Write-Host "Force: $Force"
Write-Host "DryRun: $DryRun"
Write-Host "IncludeFuture: $IncludeFuture"

if (-not (Test-Path -LiteralPath $ApiRoot)) {
    throw "API path does not exist: $ApiRoot. Run the HireSense init script first or pass -ApiPath."
}

Step "Creating top-level backend directories"

$directories = @(
    $SrcConfig,

    (Join-Path $SrcCommon "constants"),
    (Join-Path $SrcCommon "decorators"),
    (Join-Path $SrcCommon "exceptions"),
    (Join-Path $SrcCommon "filters"),
    (Join-Path $SrcCommon "guards"),
    (Join-Path $SrcCommon "interceptors"),
    (Join-Path $SrcCommon "pipes"),
    (Join-Path $SrcCommon "types"),
    (Join-Path $SrcCommon "utils"),

    (Join-Path $SrcInfrastructure "database"),
    (Join-Path $SrcInfrastructure "storage/providers"),
    (Join-Path $SrcInfrastructure "ai/dto"),
    (Join-Path $SrcInfrastructure "queue"),

    $SrcModules,

    (Join-Path $TestRoot "e2e"),
    (Join-Path $TestRoot "fixtures"),
    (Join-Path $TestRoot "helpers")
)

foreach ($directory in $directories) {
    Ensure-Directory $directory
}

Step "Creating configuration skeleton"

Write-ScaffoldFile (Join-Path $SrcConfig "app.config.ts") @'
export const appConfig = () => ({
  app: {
    name: process.env.APP_NAME ?? 'HireSense API',
    port: Number(process.env.PORT ?? 3001),
    environment: process.env.NODE_ENV ?? 'development',
  },
});
'@

Write-ScaffoldFile (Join-Path $SrcConfig "database.config.ts") @'
export const databaseConfig = () => ({
  database: {
    url: process.env.DATABASE_URL,
    timezone: 'UTC',
  },
});
'@

Write-ScaffoldFile (Join-Path $SrcConfig "auth.config.ts") @'
export const authConfig = () => ({
  auth: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
});
'@

Write-ScaffoldFile (Join-Path $SrcConfig "storage.config.ts") @'
export const storageConfig = () => ({
  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'local',
    bucket: process.env.STORAGE_BUCKET ?? 'hiresense',
  },
});
'@

Write-ScaffoldFile (Join-Path $SrcConfig "ai.config.ts") @'
export const aiConfig = () => ({
  ai: {
    baseUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
    timeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS ?? 30000),
  },
});
'@

Step "Creating common-layer skeleton"

$commonKeepFiles = @(
    "constants/.gitkeep",
    "exceptions/.gitkeep",
    "filters/.gitkeep",
    "guards/.gitkeep",
    "interceptors/.gitkeep",
    "pipes/.gitkeep",
    "types/.gitkeep",
    "utils/.gitkeep"
)

foreach ($file in $commonKeepFiles) {
    Write-ScaffoldFile (Join-Path $SrcCommon $file) ""
}

Write-ScaffoldFile (Join-Path $SrcCommon "decorators/current-user.decorator.ts") @'
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
'@

Step "Creating database infrastructure"

Write-ScaffoldFile (Join-Path $SrcInfrastructure "database/database.module.ts") @'
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
'@

Write-ScaffoldFile (Join-Path $SrcInfrastructure "database/prisma.service.ts") @'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
'@

Write-ScaffoldFile (Join-Path $SrcInfrastructure "database/transaction.ts") @'
import type { Prisma } from '../../generated/prisma/client';

export type TransactionClient = Prisma.TransactionClient;
'@

Step "Creating storage infrastructure"

Write-ScaffoldFile (Join-Path $SrcInfrastructure "storage/storage.module.ts") @'
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
'@

Write-ScaffoldFile (Join-Path $SrcInfrastructure "storage/storage.service.ts") @'
import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService {
  // Implement local/MinIO/S3 provider delegation here.
}
'@

Write-ScaffoldFile (Join-Path $SrcInfrastructure "storage/providers/.gitkeep") ""

Step "Creating AI client infrastructure"

Write-ScaffoldFile (Join-Path $SrcInfrastructure "ai/ai-client.module.ts") @'
import { Module } from '@nestjs/common';
import { AiClientService } from './ai-client.service';

@Module({
  providers: [AiClientService],
  exports: [AiClientService],
})
export class AiClientModule {}
'@

Write-ScaffoldFile (Join-Path $SrcInfrastructure "ai/ai-client.service.ts") @'
import { Injectable } from '@nestjs/common';

@Injectable()
export class AiClientService {
  // NestJS is the orchestrator. This client calls the FastAPI AI service.
}
'@

Write-ScaffoldFile (Join-Path $SrcInfrastructure "ai/dto/.gitkeep") ""
Write-ScaffoldFile (Join-Path $SrcInfrastructure "queue/.gitkeep") ""

Step "Creating Internship feature modules"

New-FeatureModule "auth" -ExtraDirectories @("guards", "strategies", "decorators")
New-FeatureModule "users"
New-FeatureModule "candidates"
New-FeatureModule "recruiters"
New-FeatureModule "companies" -ExtraDirectories @("policies")
New-FeatureModule "skills" -ExtraDirectories @("services")
New-FeatureModule "files" -ExtraDirectories @("validators")
New-FeatureModule "resumes" -ExtraDirectories @("services", "mappers")
New-FeatureModule "jobs" -ExtraDirectories @("services", "policies", "mappers")
New-FeatureModule "applications" -ExtraDirectories @("services", "policies", "mappers")
New-FeatureModule "matching" -ExtraDirectories @("services", "mappers")

if ($IncludeFuture) {
    Step "Creating V1/V2 module placeholders"

    New-FeatureModule "interviews"
    New-FeatureModule "notifications"
    New-FeatureModule "search"
    New-FeatureModule "audit" -WithController:$false
    New-FeatureModule "recommendations"
    New-FeatureModule "semantic-search" -ExtraDirectories @("repositories", "services")
}

Step "Creating auth-specific placeholders"

$authRoot = Join-Path $SrcModules "auth"
Write-ScaffoldFile (Join-Path $authRoot "guards/jwt-auth.guard.ts") @'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: replace with Passport/JWT implementation.
    return true;
  }
}
'@

Write-ScaffoldFile (Join-Path $authRoot "strategies/.gitkeep") ""
Write-ScaffoldFile (Join-Path $authRoot "decorators/.gitkeep") ""

Step "Creating test skeleton"

Write-ScaffoldFile (Join-Path $TestRoot "e2e/.gitkeep") ""
Write-ScaffoldFile (Join-Path $TestRoot "fixtures/.gitkeep") ""
Write-ScaffoldFile (Join-Path $TestRoot "helpers/.gitkeep") ""

Step "Creating AppModule"

$baseModules = @(
    "Auth",
    "Users",
    "Candidates",
    "Recruiters",
    "Companies",
    "Skills",
    "Files",
    "Resumes",
    "Jobs",
    "Applications",
    "Matching"
)

$futureModules = @()
if ($IncludeFuture) {
    $futureModules = @(
        "Interviews",
        "Notifications",
        "Search",
        "Audit",
        "Recommendations",
        "SemanticSearch"
    )
}

$allFeatureModules = @($baseModules + $futureModules)

$featureImports = @()
foreach ($module in $allFeatureModules) {
    $folder = switch ($module) {
        "SemanticSearch" { "semantic-search" }
        default { $module.ToLowerInvariant() }
    }

    $featureImports += "import { ${module}Module } from './modules/${folder}/${folder}.module';"
}

$featureModuleLines = ($allFeatureModules | ForEach-Object { "    ${_}Module," }) -join "`n"

$appModule = @"
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { storageConfig } from './config/storage.config';
import { aiConfig } from './config/ai.config';

import { DatabaseModule } from './infrastructure/database/database.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AiClientModule } from './infrastructure/ai/ai-client.module';

$($featureImports -join "`n")

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, storageConfig, aiConfig],
    }),

    DatabaseModule,
    StorageModule,
    AiClientModule,

$featureModuleLines
  ],
})
export class AppModule {}
"@

Write-ScaffoldFile (Join-Path $SrcRoot "app.module.ts") $appModule

Step "Creating scaffold documentation"

Write-ScaffoldFile (Join-Path $ApiRoot "BACKEND_STRUCTURE.md") @'
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
'@

Step "Summary"

Write-Host ""
Write-Host "Scaffold target:"
Write-Host "  $ApiRoot"
Write-Host ""
Write-Host "Next recommended steps:"
Write-Host "  1. pnpm prisma generate"
Write-Host "  2. implement UsersModule"
Write-Host "  3. implement AuthModule"
Write-Host "  4. run pnpm typecheck"
Write-Host ""

if ($DryRun) {
    Ok "Dry run completed. No files were changed."
}
else {
    Ok "HireSense NestJS backend scaffold completed."
}
