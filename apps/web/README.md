# HireSense Web

Next.js frontend for HireSense — candidate, recruiter, and admin interfaces for the recruitment and CV–job matching platform.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- TypeScript (strict), shared types from `@hiresense/types`

## Commands

Run from the repository root (or here with the same names):

```bash
pnpm dev        # development server on http://localhost:3000 (root: pnpm dev:web)
pnpm build      # production build
pnpm start      # serve the production build
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
```

## Environment

Set `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`) — see the root [`.env.example`](../../.env.example). The backend must be running for authenticated pages to work.
