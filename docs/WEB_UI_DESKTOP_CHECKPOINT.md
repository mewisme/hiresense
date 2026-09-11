# HireSense Web UI Desktop Checkpoint

Checkpoint date: **2026-09-12**

This document freezes the accepted desktop UI direction after the shadcn refactor. It is the regression reference for future web UI work until an intentional redesign replaces it.

## 1. Canonical desktop direction

- Desktop-first implementation. Mobile/tablet adaptation remains planned but deferred.
- `@hiresense/ui` is the default and only product UI primitive system.
- Current visual foundation is shadcn `base-mira` / Base UI / Tailwind CSS 4.
- Primary shadcn references used for this checkpoint: `sidebar-07`, `dashboard-01`, and `login-03`.
- Authenticated Candidate and Recruiter routes share the same application-shell architecture.
- `src/app/candidate/layout.tsx` and `src/app/recruiter/layout.tsx` own authenticated shell composition.
- `src/components/app-shell/app-shell.tsx` is the current shell baseline: collapsible sidebar, sticky header, breadcrumb context, account/theme menu, and role/company navigation.
- Feature screens use semantic shadcn tokens and shared primitives instead of a parallel custom design system.

## 2. Future UI compatibility rule

When an AI agent or developer adds a new UI feature, preserve the feature's business logic, API integration, data behavior, and domain requirements, but make its presentation conform to this checkpoint.

If newly generated UI does not visually match the current HireSense layout:

1. Do **not** create a second visual language for that feature.
2. Do **not** replace the current shell simply to accommodate one new screen.
3. Reuse `@hiresense/ui` primitives and existing page compositions first.
4. Match the current desktop density, spacing, typography, semantic tokens, page header/breadcrumb hierarchy, cards/tables/forms/status treatment, async states, and action placement.
5. Prefer a fitting official shadcn demo/block/registry composition when it improves the screen while remaining consistent with this checkpoint.
6. If the feature arrives with incompatible generated/custom styling, keep its behavior and refactor its presentation back into the current HireSense layout.
7. Mobile-specific adaptation stays deferred until the mobile phase unless the task explicitly changes that priority.

The default assumption is therefore: **new UI adapts to this checkpoint; this checkpoint does not drift to match arbitrary new UI.**

## 3. Visual regression baseline

Playwright snapshots live under:

```text
apps/web/e2e/desktop-checkpoint.spec.ts-snapshots/
```

Current desktop widths:

```text
1024
1280
1440
1600
1920
```

The suite records Candidate and Recruiter overview snapshots at all five widths, a Candidate dark-theme reference at 1440px, and the explainable matching detail at 1440px.

The suite also asserts that the desktop document does not introduce unexpected horizontal page overflow and that the sidebar/header/main shell remains visible with usable content width.

## 4. Behavioral checkpoint

The browser suite covers the real Candidate -> Recruiter -> Candidate flow against deterministic seeded data:

```text
Candidate login
-> overview
-> browse jobs
-> job detail
-> verify selected Demo CV
-> resumes
-> applications
-> application detail before analysis

Recruiter login
-> companies
-> company jobs
-> job management
-> applicants
-> applicant review
-> run baseline analysis
-> verify explainable result
-> move Applied -> Screening

Candidate login
-> application detail
-> verify Screening
-> verify explainable matching result
```

Additional shell checks:

- sidebar collapses at 1024px without layout overflow;
- `Ctrl+B` restores/toggles the desktop sidebar;
- account dropdown opens without Base UI runtime errors;
- dark theme applies and has a visual baseline.

## 5. QA commands

`@playwright/test` is installed directly in `apps/web`.

The Playwright harness is **TypeScript ESM only**:

```text
apps/web/playwright.config.ts
apps/web/e2e/desktop-checkpoint.spec.ts
```

`apps/web/package.json` declares `"type": "module"`. Do not introduce `.cjs` Playwright config/tests or CommonJS `require()` for this QA harness.

Run the accepted checkpoint:

```bash
pnpm --filter @hiresense/web qa:desktop
```

Regenerate snapshots only for an intentional, reviewed UI change:

```bash
pnpm --filter @hiresense/web qa:desktop:update
```

**Never run the update command merely to make a visual regression failure disappear.** First determine whether the difference is an intended improvement or an accidental layout drift. For accidental drift, fix the implementation and keep the existing snapshot.

## 6. Checkpoint validation state

Accepted on 2026-09-12:

```text
@hiresense/web desktop Playwright checkpoint  PASS (16/16)
@hiresense/ui typecheck                     PASS
@hiresense/ui lint                          PASS
@hiresense/web typecheck                    PASS
@hiresense/web lint                         PASS
@hiresense/web build                        PASS
git diff --check                            PASS
```

The Playwright suite runs against `http://localhost:3000` and the API health endpoint at `http://localhost:4000/api/health`.

## 7. Browser-QA fixes included in this baseline

Browser testing found issues not visible from typecheck/build alone; these fixes are part of the checkpoint and should not be casually reverted:

- login submit is guarded until client hydration is active;
- Base UI `Button` link rendering uses the correct non-native-button semantics;
- `SelectValue` displays human-readable labels instead of raw IDs for current resume/stage/education selectors;
- account dropdown groups `DropdownMenuLabel` correctly under Base UI `Menu.Group`;
- deterministic browser seed clears existing matching results before rebuilding resume-derived fixture rows, so repeated QA runs remain idempotent.

## 8. Snapshot update policy for future agents

When adding or changing UI:

1. Read this checkpoint and `.local/CONTEXT.md` first.
2. Implement the feature using the current shell and shadcn conventions.
3. Run `qa:desktop` before changing snapshots.
4. If a snapshot differs unexpectedly, refactor the new UI to match this checkpoint.
5. If an intentional global redesign is approved, update implementation and checkpoint documentation together, then regenerate snapshots.
6. For a newly important stable screen, extend the Playwright checkpoint rather than weakening existing assertions.

This checkpoint remains canonical until a later explicit redesign decision supersedes it.
