# Technology Stack

**Analysis Date:** 2026-04-26

## Languages

**Primary:**

- TypeScript 5.9.3 - Application source, Next.js route handlers, domain logic, repositories, and config files under `src/`, `test/`, `next.config.ts`, `drizzle.config.ts`, and `vitest.config.ts`.
- TSX / React JSX - App Router pages and UI components under `src/app/` and `src/components/`.

**Secondary:**

- SQL - Drizzle-generated and hand-runnable PostgreSQL migrations in `src/modules/db/migrations/0000_initial.sql` and `src/modules/db/migrations/0001_market_data_chunks.sql`.
- CSS / Tailwind CSS 4.1.16 - Global styling in `src/app/globals.css` with Tailwind loaded through `postcss.config.mjs`.
- ECMAScript modules - Tooling config in `eslint.config.mjs` and `postcss.config.mjs`.
- Dockerfile / YAML - Container runtime in `Dockerfile` and local service composition in `docker-compose.yml`.

## Runtime

**Environment:**

- Bun 1.3.13 is the configured runtime and package-manager version in `package.json`.
- `Dockerfile` uses `oven/bun:1.3.13` for dependency, build, and runtime stages.
- `README.md` documents Bun 1.3+ and Docker Compose as local prerequisites.
- No Node version pin is present: `.nvmrc` and `.node-version` were not detected.

**Package Manager:**

- Bun 1.3.13.
- Lockfile: present at `bun.lock`.
- npm/pnpm/yarn lockfiles are not detected; keep using `bun install --frozen-lockfile` for reproducible installs as shown in `Dockerfile`.

## Frameworks

**Core:**

- Next.js 16.2.4 - Full-stack app framework using the App Router in `src/app/`; route handlers live under `src/app/api/`.
- React 19.2.0 and React DOM 19.2.0 - UI rendering for pages and components under `src/app/` and `src/components/`.
- Drizzle ORM 0.44.7 - PostgreSQL schema and query layer in `src/modules/db/schema.ts`, `src/modules/db/client.ts`, `src/modules/backtests/server/backtest-repository.ts`, `src/modules/backtests/server/backtest-run-repository.ts`, and `src/modules/market-data/server/market-data-chunk-repository.ts`.
- Tailwind CSS 4.1.16 - Styling via `@import "tailwindcss"` in `src/app/globals.css` and `@tailwindcss/postcss` in `postcss.config.mjs`.

**Testing:**

- Vitest 3.2.4 - Unit test runner configured in `vitest.config.ts`; tests live in `test/**/*.test.ts`.
- jsdom 27.0.1 and `@testing-library/react` 16.3.0 are available for UI-oriented tests, though current `vitest.config.ts` uses the `node` environment.

**Build/Dev:**

- Next.js CLI - `package.json` scripts use `next dev`, `next build`, and `next start`.
- TypeScript compiler - `bun run typecheck` executes `tsc --noEmit` through `package.json`.
- ESLint 9.39.1 with `eslint-config-next` 16.2.4 - Configured in `eslint.config.mjs`.
- Drizzle Kit 0.31.5 - `bun run db:generate` executes `drizzle-kit generate` using `drizzle.config.ts`.
- tsx 4.20.6 - `bun run db:migrate` executes `tsx src/modules/db/migrate.ts`.
- Docker / Docker Compose - Local full-stack runtime defined by `Dockerfile` and `docker-compose.yml`.

## Key Dependencies

**Critical:**

- `next` 16.2.4 - Owns routing, rendering, build output, and server runtime; configured for standalone output in `next.config.ts`.
- `react` 19.2.0 and `react-dom` 19.2.0 - Required by all TSX UI under `src/app/` and `src/components/`.
- `drizzle-orm` 0.44.7 - Type-safe database schema and queries in `src/modules/db/` and server repositories.
- `pg` 8.16.3 - PostgreSQL connection pool used by `src/modules/db/client.ts`.
- `zod` 4.1.12 - Boundary validation in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/modules/backtests/ui/backtest-form-schema.ts`, and `src/modules/market-data/domain/market-data-validation.ts`.
- `server-only` 0.0.1 - Guards server-side modules such as `src/modules/market-data/server/market-data-service.ts`, `src/modules/backtests/server/backtest-service.ts`, and `src/modules/build-info/build-info.ts`.

**Infrastructure:**

- `drizzle-kit` 0.31.5 - Migration generation from `src/modules/db/schema.ts` into `src/modules/db/migrations/`.
- `tsx` 4.20.6 - Runs the migration entrypoint at `src/modules/db/migrate.ts`.
- `postgres` 3.4.7 - Declared in `package.json`; no imports were detected in `src/` or `test/`, while active database access uses `pg`.
- `echarts` 6.0.0 and `echarts-for-react` 3.0.2 - Chart rendering in `src/components/charts/backtest-result-charts.tsx` and `src/components/charts/market-data-charts.tsx`.
- `date-fns` 4.1.0 - Date formatting and date utility dependency declared in `package.json`.
- `@tailwindcss/postcss` 4.1.16 - PostCSS integration configured in `postcss.config.mjs`.

## Configuration

**Environment:**

- Runtime env vars are read directly through `process.env` in server-side code.
- `DATABASE_URL` controls PostgreSQL access in `src/modules/db/client.ts` and Drizzle Kit access in `drizzle.config.ts`.
- `ALPHA_VANTAGE_API_KEY` enables the real Alpha Vantage market-data provider in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
- `MARKET_DATA_SOURCE` switches backtest candles between generated sample data and stored downloaded chunks in `src/modules/backtests/server/service-singleton.ts`.
- `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_APP_COMMIT`, and `NEXT_PUBLIC_APP_BUILD_TIME` provide visible build provenance through `src/modules/build-info/build-info.ts` and Docker build args in `Dockerfile`.
- `PORT` is used by the production container and documented in `README.md`; `Dockerfile` defaults it to `3000`.
- `.env.example` exists as an environment template, but its contents are intentionally not copied here.

**Build:**

- `next.config.ts` sets `output: "standalone"` for container-friendly production output.
- `tsconfig.json` enables strict TypeScript, `react-jsx`, `moduleResolution: "bundler"`, and the `@/*` path alias to `./src/*`.
- `vitest.config.ts` mirrors the `@` alias and runs `test/**/*.test.ts` in the Node environment.
- `eslint.config.mjs` extends Next core-web-vitals and TypeScript configs, and ignores generated/build outputs.
- `drizzle.config.ts` points Drizzle Kit at `src/modules/db/schema.ts` and emits migrations to `src/modules/db/migrations`.
- `postcss.config.mjs` registers `@tailwindcss/postcss`.
- `Dockerfile` builds with Bun, injects public build provenance args, copies Next standalone output, and runs `bun server.js`.
- `docker-compose.yml` defines local `app` and `postgres` services; sensitive connection values are not documented here.

## Platform Requirements

**Development:**

- Use Bun as the package manager and script runner, matching `package.json` and `bun.lock`.
- Start a PostgreSQL-compatible database before using persisted app paths; the local full stack is available through `docker-compose.yml`.
- Run migrations with `bun run db:migrate` before relying on repository-backed features.
- Use `bun run verify` as the repo-native verification entrypoint; it runs lint, typecheck, tests, and production build according to `package.json`.
- Repo workflow guidance lives in `AGENTS.md`, `AGENTS.bright-builds.md`, and `standards-overrides.md`; the referenced local `standards/index.md` file is not present in this checkout.

**Production:**

- The production artifact is a Next standalone server from `next.config.ts`, packaged by `Dockerfile`.
- `README.md` documents Railway as the intended deployment topology: one web service from `Dockerfile` plus a managed PostgreSQL service.
- The app binds to IPv6 host `::` for production compatibility through `package.json` and `Dockerfile`.
- Production requires `DATABASE_URL`; without it, build-safe page helpers return placeholder or empty data for static build paths in `src/modules/backtests/server/build-safe-backtest-service.ts` and `src/modules/market-data/server/build-safe-market-data-service.ts`.

---

_Stack analysis: 2026-04-26_
