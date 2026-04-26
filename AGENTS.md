<!-- bright-builds-rules-managed:begin -->

# Bright Builds Rules

`AGENTS.md` is the entrypoint for repo-local instructions, not the complete Bright Builds Rules specification.

This managed block is owned upstream by `bright-builds-rules`. If this block needs a fix, open an upstream PR or issue instead of editing the managed text in a downstream repo. Keep downstream-specific instructions outside this managed block.

Before plan, review, implementation, or audit work:

1. Read the repo-local instructions in `AGENTS.md`, including any `## Repo-Local Guidance` section and any instructions outside this managed block.
1. Read `AGENTS.bright-builds.md`.
1. Read `standards-overrides.md` when present.
1. Read the pinned canonical standards pages relevant to the task.
1. If you have not done that yet, stop and load those sources before continuing.

Use this routing map when deciding what to load next:

- For repo-specific commands, prerequisites, generated-file ownership, CI-only suites, or recurring workflow facts, use the local `AGENTS.md`, especially `## Repo-Local Guidance`.
- For the Bright Builds default workflow and high-signal cross-cutting rules used in most tasks, use `AGENTS.bright-builds.md`.
- For deliberate repo-specific exceptions to the Bright Builds defaults, use `standards-overrides.md`.
- To choose the right pinned canonical standards page, start with the Bright Builds entrypoint `standards/index.md`.
- For business-logic structure, domain modeling, and functional-core versus imperative-shell decisions, use the canonical page `standards/core/architecture.md`.
- For control flow, naming, function/file size, and readability rules, use the canonical page `standards/core/code-shape.md`.
- For sync, bootstrap, and pre-commit verification rules, use the canonical page `standards/core/verification.md`.
- For unit-test expectations, use the canonical page `standards/core/testing.md`.
- For Rust or TypeScript/JavaScript-specific rules, use the matching canonical page under `standards/languages/`.
- Keep recurring repo-specific workflow facts, commands, and links in a `## Repo-Local Guidance` section elsewhere in this file.
- Record deliberate repo-specific exceptions and override decisions in `standards-overrides.md`.
- If instructions elsewhere in `AGENTS.md` conflict with `AGENTS.bright-builds.md`, follow the repo-local instructions and treat them as an explicit local exception.

<!-- bright-builds-rules-managed:end -->

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Simple Market Maker**

Simple Market Maker is a single-admin stock ladder backtesting app for configuring ladder strategies, fetching and managing market data, running backtests, and reviewing charted results. The current app already persists backtest definitions, market-data chunks, and run results; the next push is to make real market data the polished default path while keeping sample/custom data available behind clearer gates.

The product should feel like a practical trading research workstation: quiet, data-forward, and clear about where every data point came from. Live broker integrations and real order placement are a later milestone, after the real-data backtesting foundation is reliable.

**Core Value:** A user can confidently run ladder backtests against clearly sourced real market data and understand the resulting performance from polished charts, metrics, and data provenance.

### Constraints

- **Tech stack**: Continue with Bun, Next.js App Router, TypeScript, PostgreSQL, Drizzle ORM, Tailwind CSS, and ECharts — this is the existing working stack.
- **UI system**: Add Magic UI selectively for refined app surfaces, not as a full visual rewrite — the product should stay data-forward and operational.
- **User model**: Design for a single admin user in this milestone — avoid building account/team abstractions prematurely.
- **Market data**: Real market data should become the normal backtest path — sample/synthetic data remains available only through explicit demo/development/custom-data gates.
- **Provider keys**: Persist provider API keys for a single-admin setup — treat them as sensitive, but do not block v1 on a full multi-user credential architecture.
- **Fetch behavior**: Confirm-before-fetch is the default for missing backtest data — silent fetch is allowed only when enabled in settings and must still show progress.
- **Currency**: Default market data assumptions can use USD — deeper currency/exchange modeling is deferred unless required by a chosen provider.
- **Verification**: Use the repo-native `bun run verify` command before commits when implementation changes are made.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - Application source, Next.js route handlers, domain logic, repositories, and config files under `src/`, `test/`, `next.config.ts`, `drizzle.config.ts`, and `vitest.config.ts`.
- TSX / React JSX - App Router pages and UI components under `src/app/` and `src/components/`.
- SQL - Drizzle-generated and hand-runnable PostgreSQL migrations in `src/modules/db/migrations/0000_initial.sql` and `src/modules/db/migrations/0001_market_data_chunks.sql`.
- CSS / Tailwind CSS 4.1.16 - Global styling in `src/app/globals.css` with Tailwind loaded through `postcss.config.mjs`.
- ECMAScript modules - Tooling config in `eslint.config.mjs` and `postcss.config.mjs`.
- Dockerfile / YAML - Container runtime in `Dockerfile` and local service composition in `docker-compose.yml`.
## Runtime
- Bun 1.3.13 is the configured runtime and package-manager version in `package.json`.
- `Dockerfile` uses `oven/bun:1.3.13` for dependency, build, and runtime stages.
- `README.md` documents Bun 1.3+ and Docker Compose as local prerequisites.
- No Node version pin is present: `.nvmrc` and `.node-version` were not detected.
- Bun 1.3.13.
- Lockfile: present at `bun.lock`.
- npm/pnpm/yarn lockfiles are not detected; keep using `bun install --frozen-lockfile` for reproducible installs as shown in `Dockerfile`.
## Frameworks
- Next.js 16.2.4 - Full-stack app framework using the App Router in `src/app/`; route handlers live under `src/app/api/`.
- React 19.2.0 and React DOM 19.2.0 - UI rendering for pages and components under `src/app/` and `src/components/`.
- Drizzle ORM 0.44.7 - PostgreSQL schema and query layer in `src/modules/db/schema.ts`, `src/modules/db/client.ts`, `src/modules/backtests/server/backtest-repository.ts`, `src/modules/backtests/server/backtest-run-repository.ts`, and `src/modules/market-data/server/market-data-chunk-repository.ts`.
- Tailwind CSS 4.1.16 - Styling via `@import "tailwindcss"` in `src/app/globals.css` and `@tailwindcss/postcss` in `postcss.config.mjs`.
- Vitest 3.2.4 - Unit test runner configured in `vitest.config.ts`; tests live in `test/**/*.test.ts`.
- jsdom 27.0.1 and `@testing-library/react` 16.3.0 are available for UI-oriented tests, though current `vitest.config.ts` uses the `node` environment.
- Next.js CLI - `package.json` scripts use `next dev`, `next build`, and `next start`.
- TypeScript compiler - `bun run typecheck` executes `tsc --noEmit` through `package.json`.
- ESLint 9.39.1 with `eslint-config-next` 16.2.4 - Configured in `eslint.config.mjs`.
- Drizzle Kit 0.31.5 - `bun run db:generate` executes `drizzle-kit generate` using `drizzle.config.ts`.
- tsx 4.20.6 - `bun run db:migrate` executes `tsx src/modules/db/migrate.ts`.
- Docker / Docker Compose - Local full-stack runtime defined by `Dockerfile` and `docker-compose.yml`.
## Key Dependencies
- `next` 16.2.4 - Owns routing, rendering, build output, and server runtime; configured for standalone output in `next.config.ts`.
- `react` 19.2.0 and `react-dom` 19.2.0 - Required by all TSX UI under `src/app/` and `src/components/`.
- `drizzle-orm` 0.44.7 - Type-safe database schema and queries in `src/modules/db/` and server repositories.
- `pg` 8.16.3 - PostgreSQL connection pool used by `src/modules/db/client.ts`.
- `zod` 4.1.12 - Boundary validation in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/modules/backtests/ui/backtest-form-schema.ts`, and `src/modules/market-data/domain/market-data-validation.ts`.
- `server-only` 0.0.1 - Guards server-side modules such as `src/modules/market-data/server/market-data-service.ts`, `src/modules/backtests/server/backtest-service.ts`, and `src/modules/build-info/build-info.ts`.
- `drizzle-kit` 0.31.5 - Migration generation from `src/modules/db/schema.ts` into `src/modules/db/migrations/`.
- `tsx` 4.20.6 - Runs the migration entrypoint at `src/modules/db/migrate.ts`.
- `postgres` 3.4.7 - Declared in `package.json`; no imports were detected in `src/` or `test/`, while active database access uses `pg`.
- `echarts` 6.0.0 and `echarts-for-react` 3.0.2 - Chart rendering in `src/components/charts/backtest-result-charts.tsx` and `src/components/charts/market-data-charts.tsx`.
- `date-fns` 4.1.0 - Date formatting and date utility dependency declared in `package.json`.
- `@tailwindcss/postcss` 4.1.16 - PostCSS integration configured in `postcss.config.mjs`.
## Configuration
- Runtime env vars are read directly through `process.env` in server-side code.
- `DATABASE_URL` controls PostgreSQL access in `src/modules/db/client.ts` and Drizzle Kit access in `drizzle.config.ts`.
- `ALPHA_VANTAGE_API_KEY` enables the real Alpha Vantage market-data provider in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
- `MARKET_DATA_SOURCE` switches backtest candles between generated sample data and stored downloaded chunks in `src/modules/backtests/server/service-singleton.ts`.
- `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_APP_COMMIT`, and `NEXT_PUBLIC_APP_BUILD_TIME` provide visible build provenance through `src/modules/build-info/build-info.ts` and Docker build args in `Dockerfile`.
- `PORT` is used by the production container and documented in `README.md`; `Dockerfile` defaults it to `3000`.
- `.env.example` exists as an environment template, but its contents are intentionally not copied here.
- `next.config.ts` sets `output: "standalone"` for container-friendly production output.
- `tsconfig.json` enables strict TypeScript, `react-jsx`, `moduleResolution: "bundler"`, and the `@/*` path alias to `./src/*`.
- `vitest.config.ts` mirrors the `@` alias and runs `test/**/*.test.ts` in the Node environment.
- `eslint.config.mjs` extends Next core-web-vitals and TypeScript configs, and ignores generated/build outputs.
- `drizzle.config.ts` points Drizzle Kit at `src/modules/db/schema.ts` and emits migrations to `src/modules/db/migrations`.
- `postcss.config.mjs` registers `@tailwindcss/postcss`.
- `Dockerfile` builds with Bun, injects public build provenance args, copies Next standalone output, and runs `bun server.js`.
- `docker-compose.yml` defines local `app` and `postgres` services; sensitive connection values are not documented here.
## Platform Requirements
- Use Bun as the package manager and script runner, matching `package.json` and `bun.lock`.
- Start a PostgreSQL-compatible database before using persisted app paths; the local full stack is available through `docker-compose.yml`.
- Run migrations with `bun run db:migrate` before relying on repository-backed features.
- Use `bun run verify` as the repo-native verification entrypoint; it runs lint, typecheck, tests, and production build according to `package.json`.
- Repo workflow guidance lives in `AGENTS.md`, `AGENTS.bright-builds.md`, and `standards-overrides.md`; the referenced local `standards/index.md` file is not present in this checkout.
- The production artifact is a Next standalone server from `next.config.ts`, packaged by `Dockerfile`.
- `README.md` documents Railway as the intended deployment topology: one web service from `Dockerfile` plus a managed PostgreSQL service.
- The app binds to IPv6 host `::` for production compatibility through `package.json` and `Dockerfile`.
- Production requires `DATABASE_URL`; without it, build-safe page helpers return placeholder or empty data for static build paths in `src/modules/backtests/server/build-safe-backtest-service.ts` and `src/modules/market-data/server/build-safe-market-data-service.ts`.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Use kebab-case for source files under domain, server, component, and config areas: `src/modules/market-data/domain/candle-series.ts`, `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/components/app-shell/provenance-footer.tsx`.
- Use Next.js App Router filenames for routes and pages: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/api/backtests/[id]/route.ts`, `src/app/market-data/[id]/page.tsx`.
- Use `.test.ts` for tests in the top-level `test/` tree: `test/market-data/candle-series.test.ts`, `test/backtests/domain/backtest-domain.test.ts`.
- Use `camelCase` for ordinary functions and helpers: `normalizeTicker` in `src/modules/market-data/domain/market-data-chunk.ts`, `orderNotionalValue` in `src/modules/backtests/domain/backtest-definition.ts`, `sortCandlesAscending` in `src/modules/market-data/domain/candle-series.ts`.
- Prefix functions returning nullable or absence-like success values with `maybe`: `maybeDatabaseUrl` in `src/modules/db/client.ts`, `maybeApiMessage` in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`, `maybeParseMarketDataChunk` in `src/modules/market-data/domain/market-data-validation.ts`.
- Use `get...OrThrow` names for helpers that enforce required runtime state by throwing: `getPostgresPoolOrThrow` and `getDbOrThrow` in `src/modules/db/client.ts`.
- Use PascalCase for React component functions: `BacktestForm` in `src/components/backtests/backtest-form.tsx`, `DataTable` in `src/components/ui/data-table.tsx`, `ProvenanceFooter` in `src/components/app-shell/provenance-footer.tsx`.
- Use uppercase HTTP method exports for Next route handlers: `GET`, `POST`, `PUT`, and `DELETE` in `src/app/api/backtests/[id]/route.ts`.
- Use `camelCase` for locals and module constants: `defaultEngineVersion` in `src/modules/backtests/server/backtest-service.ts`, `alphaVantageDailySeriesKey` in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
- Prefix nullable locals, parameters, fields, and props with `maybe`: `maybeBacktest` in `src/modules/backtests/server/backtest-service.ts`, `maybeClassName` in `src/components/ui/shell.tsx`, `maybeDefinition` in `src/components/backtests/backtest-form.tsx`.
- Use plural names for enum-like readonly arrays: `orderSizeModes` and `fillPolicies` in `src/modules/backtests/domain/backtest-definition.ts`, `marketDataSources` and `marketDataIntervals` in `src/modules/market-data/domain/market-data-chunk.ts`.
- Use PascalCase `type` aliases for domain records, props, dependencies, and result shapes: `BacktestDefinitionDraft` in `src/modules/backtests/domain/backtest-definition.ts`, `MarketDataServiceDependencies` in `src/modules/market-data/server/market-data-service.ts`, `BacktestFormProps` in `src/components/backtests/backtest-form.tsx`.
- Prefer `type` aliases over `interface`; no project-owned `interface` declarations are detected in `src/`.
- Model controlled operation results as discriminated unions with `ok: true` and `ok: false`: `ParsedBacktestDefinitionResult` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `CreateMarketDataChunkResult` in `src/modules/market-data/server/market-data-service.ts`.
- Derive union types from `as const` arrays: `OrderSizeMode` and `FillPolicy` in `src/modules/backtests/domain/backtest-definition.ts`, `MarketDataSource` and `MarketDataInterval` in `src/modules/market-data/domain/market-data-chunk.ts`.
## Code Style
- Use the existing TypeScript style: 2-space indentation, double quotes, semicolons, trailing commas in multiline structures, and explicit return types on exported functions where the surrounding file does so.
- No Prettier, Biome, or `.editorconfig` configuration is detected. Use the observed style in `src/modules/market-data/domain/market-data-validation.ts`, `src/modules/backtests/server/backtest-service.ts`, and `src/components/ui/data-table.tsx`.
- Numeric literals may use separators for readability: `10_000` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `1_000` in `src/modules/market-data/domain/market-data-chunk.ts`.
- Use ESLint through `bun run lint`, defined as `eslint .` in `package.json`.
- ESLint is configured in `eslint.config.mjs` with `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`, and global ignores for `.next/**`, `coverage/**`, `dist/**`, `drizzle/**`, and `next-env.d.ts`.
- TypeScript is strict in `tsconfig.json`; keep `allowJs: false`, `strict: true`, `isolatedModules: true`, and `noEmit: true` assumptions intact.
## Import Organization
- Use `@/*` for code under `src/*`, configured in `tsconfig.json` and mirrored in `vitest.config.ts`.
- Avoid long relative imports inside `src/`; the main relative import exception is `../../../package.json` in `src/modules/build-info/build-info.ts`.
## Error Handling
- Parse untrusted form input with Zod at boundaries, then return typed result unions rather than throwing validation errors: `maybeParseBacktestDefinition` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `maybeParseMarketDataChunk` in `src/modules/market-data/domain/market-data-validation.ts`.
- Use early returns for invalid or absent paths before the main behavior: `getPostgresPool` in `src/modules/db/client.ts`, `createChunk` in `src/modules/market-data/server/market-data-service.ts`, route handlers in `src/app/api/backtests/[id]/route.ts`.
- Throw explicit `Error` objects for operational failures, malformed external data, and required runtime state: `parseAlphaVantageDailyCandles` in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`, `candlesFromJson` in `src/modules/market-data/server/market-data-chunk-repository.ts`, `runLadderBacktest` in `src/modules/backtests/domain/run-ladder-backtest.ts`.
- Catch provider and engine failures at service boundaries and convert them into user-facing result objects: `runBacktest` in `src/modules/backtests/server/backtest-service.ts`, `createChunk` in `src/modules/market-data/server/market-data-service.ts`.
- Map service results to HTTP responses in App Router handlers: return `400` for validation failures in `src/app/api/market-data/route.ts`, return `404` for missing resources in `src/app/api/backtests/[id]/route.ts`, return `201` for creation in `src/app/api/market-data/route.ts`.
## Logging
- Do not add broad application logging by default; no logging wrapper or observability SDK is detected in `src/`.
- Use `console.error` only for command-line script failure reporting, as in `src/modules/db/migrate.ts`, where the top-level `main()` catch logs the migration failure and sets `process.exitCode = 1`.
- For request, domain, and service failures, return structured errors or throw explicit `Error` objects instead of logging and continuing silently: `src/modules/backtests/server/backtest-service.ts`, `src/modules/market-data/server/market-data-service.ts`.
## Comments
- Production code is largely self-documenting; add comments only for non-obvious intent, not for restating simple assignments.
- Tests use explicit Arrange, Act, and Assert comments consistently: `test/market-data/market-data-validation.test.ts`, `test/backtests/domain/backtest-domain.test.ts`, `test/market-data/alpha-vantage-market-data-provider.test.ts`.
- JSDoc/TSDoc is not used in `src/`. Prefer clear type aliases and function names over documentation comments unless adding a public API with behavior that is not obvious from the type.
## Function Design
- Use arrays for pure transformations: `sortCandlesAscending` and `filterCandlesByDateRange` in `src/modules/market-data/domain/candle-series.ts`.
- Use discriminated unions for expected success/failure flows: `ParsedMarketDataChunkResult` in `src/modules/market-data/domain/market-data-validation.ts`.
- Use `null` for missing records and name the callsite variable with `maybe`: `getBacktest` in `src/modules/backtests/server/backtest-service.ts`, `getChunk` in `src/modules/market-data/server/market-data-service.ts`.
- Use thrown errors for invariant failures or external-service failures that callers should catch at service or test boundaries: `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
## Module Design
- Server-only modules must start with `import "server-only";`: `src/modules/backtests/server/backtest-repository.ts`, `src/modules/market-data/server/service-singleton.ts`, `src/modules/build-info/build-info.ts`.
- Interactive React components must start with `"use client";`: `src/components/backtests/backtest-form.tsx`, `src/components/market-data/market-data-form.tsx`, `src/components/charts/backtest-result-charts.tsx`.
- Keep business logic in `src/modules/**/domain/` as data-in, data-out functions, and keep Next.js, database, and fetch orchestration in `src/app/**` and `src/modules/**/server/`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- UI routes live in `src/app/` and delegate business work to services under `src/modules/*/server/`.
- Domain rules live in pure data/type modules under `src/modules/*/domain/` and are reused by server code, client forms, pages, charts, and tests.
- Persistence is centralized through Drizzle schema/client files in `src/modules/db/`, while repositories map between Drizzle rows and domain records.
- Client components submit through colocated API routes in `src/app/api/`; server components read directly from server services.
- Build-safe service wrappers in `src/modules/backtests/server/build-safe-backtest-service.ts` and `src/modules/market-data/server/build-safe-market-data-service.ts` allow static build paths to render when `DATABASE_URL` is unavailable.
## Layers
- Purpose: Handle HTTP route entry, page rendering, route params, redirects, and JSON status codes.
- Location: `src/app/`
- Contains: `page.tsx`, `layout.tsx`, and `route.ts` files such as `src/app/page.tsx`, `src/app/backtests/[id]/page.tsx`, `src/app/market-data/[id]/page.tsx`, `src/app/api/backtests/route.ts`, and `src/app/api/market-data/[id]/route.ts`.
- Depends on: Shared components in `src/components/`, domain types/helpers in `src/modules/*/domain/`, and server services in `src/modules/*/server/`.
- Used by: Next.js runtime and browser requests.
- Use this layer for new route handlers, page-level data loading, route params, `notFound()`, `redirect()`, and `NextResponse` mapping.
- Purpose: Render reusable UI shells, forms, charts, tables, stats, and app chrome.
- Location: `src/components/`
- Contains: Shared UI primitives in `src/components/ui/`, app shell components in `src/components/app-shell/`, feature forms in `src/components/backtests/backtest-form.tsx` and `src/components/market-data/market-data-form.tsx`, and ECharts wrappers in `src/components/charts/`.
- Depends on: React/Next client APIs, domain helpers such as `src/modules/backtests/domain/ladder-level.ts`, domain form types such as `src/modules/backtests/domain/backtest-definition.ts`, and API route URLs.
- Used by: Pages under `src/app/`.
- Use client components only when browser state, `fetch`, `useRouter`, clipboard access, or chart rendering requires `"use client"`.
- Purpose: Model saved backtests, candles, ladder levels, simulation state, metrics, chart artifacts, validation, and the ladder backtest engine.
- Location: `src/modules/backtests/domain/`
- Contains: Types and pure functions in `src/modules/backtests/domain/backtest-definition.ts`, `src/modules/backtests/domain/candle.ts`, `src/modules/backtests/domain/ladder-level.ts`, `src/modules/backtests/domain/simulation-state.ts`, `src/modules/backtests/domain/metrics.ts`, `src/modules/backtests/domain/chart-series.ts`, and `src/modules/backtests/domain/run-ladder-backtest.ts`.
- Depends on: Other domain modules and `zod` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`.
- Used by: `src/modules/backtests/server/backtest-service.ts`, `src/components/backtests/backtest-form.tsx`, `src/components/charts/backtest-result-charts.tsx`, market-data modules through shared `Candle` types, and tests under `test/backtests/domain/`.
- Use this layer for business rules that can run without Next.js, database access, network calls, or environment variables.
- Purpose: Model market data chunks, validate market data requests, normalize tickers/notes, and transform candle series for summaries and charts.
- Location: `src/modules/market-data/domain/`
- Contains: `src/modules/market-data/domain/market-data-chunk.ts`, `src/modules/market-data/domain/market-data-validation.ts`, and `src/modules/market-data/domain/candle-series.ts`.
- Depends on: Shared `Candle` and `PriceSeriesPoint` types from `src/modules/backtests/domain/candle.ts`, plus `zod` in `src/modules/market-data/domain/market-data-validation.ts`.
- Used by: `src/modules/market-data/server/market-data-service.ts`, `src/modules/backtests/server/stored-market-data-provider.ts`, `src/app/market-data/[id]/page.tsx`, `src/components/market-data/market-data-form.tsx`, and tests under `test/market-data/`.
- Use this layer for ticker/date normalization, candle filtering/sorting, and chunk-level domain behavior.
- Purpose: Coordinate validation, repositories, providers, engine execution, error-to-result mapping, and use-case methods.
- Location: `src/modules/*/server/`
- Contains: Backtest orchestration in `src/modules/backtests/server/backtest-service.ts`, market-data orchestration in `src/modules/market-data/server/market-data-service.ts`, singleton factories in `src/modules/backtests/server/service-singleton.ts` and `src/modules/market-data/server/service-singleton.ts`, and build-safe substitutes.
- Depends on: Domain modules, repositories, provider interfaces, and environment-based factory choices.
- Used by: App Router pages and API routes.
- Keep `import "server-only";` in server modules that touch database, environment, network providers, or service singletons.
- Purpose: Own Drizzle queries, row-to-domain mapping, numeric/string conversion, JSON serialization, and database record creation/update/delete.
- Location: `src/modules/backtests/server/*repository.ts`, `src/modules/market-data/server/market-data-chunk-repository.ts`, and `src/modules/db/`.
- Contains: `src/modules/backtests/server/backtest-repository.ts`, `src/modules/backtests/server/backtest-run-repository.ts`, `src/modules/market-data/server/market-data-chunk-repository.ts`, `src/modules/db/schema.ts`, `src/modules/db/client.ts`, and `src/modules/db/migrate.ts`.
- Depends on: Drizzle ORM, `pg`, table schema exports, and domain record/draft types.
- Used by: Server services and providers such as `src/modules/backtests/server/stored-market-data-provider.ts`.
- Put SQL table definitions only in `src/modules/db/schema.ts`; put row mapping and query methods in the repository that owns the feature.
- Purpose: Fetch or synthesize candle data behind feature-specific provider interfaces.
- Location: `src/modules/backtests/server/` and `src/modules/market-data/server/`
- Contains: `src/modules/backtests/server/market-data-provider.ts`, `src/modules/backtests/server/sample-market-data-provider.ts`, `src/modules/backtests/server/stored-market-data-provider.ts`, `src/modules/market-data/server/market-data-provider.ts`, `src/modules/market-data/server/provider-factory.ts`, `src/modules/market-data/server/sample-market-data-fetch-provider.ts`, and `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
- Depends on: Domain candle and chunk types, repositories for stored chunks, `fetch`, and environment variable names.
- Used by: `src/modules/backtests/server/backtest-service.ts` and `src/modules/market-data/server/market-data-service.ts`.
- Add new providers by implementing the relevant provider interface and wiring source selection through `src/modules/market-data/server/provider-factory.ts` or `src/modules/backtests/server/service-singleton.ts`.
- Purpose: Expose version, commit, build time, and copyable provenance in product chrome.
- Location: `src/modules/build-info/build-info.ts` and `src/components/app-shell/`
- Contains: `getBuildInfo()` in `src/modules/build-info/build-info.ts`, server wrapper `src/components/app-shell/app-footer.tsx`, and client clipboard UI `src/components/app-shell/provenance-footer.tsx`.
- Depends on: `package.json` version and `NEXT_PUBLIC_APP_*` environment variables.
- Used by: `src/app/layout.tsx` and `src/app/page.tsx`.
## Data Flow
- Server state is persisted in PostgreSQL tables defined in `src/modules/db/schema.ts`.
- Browser form state is local React state in `src/components/backtests/backtest-form.tsx` and `src/components/market-data/market-data-form.tsx`.
- Service singletons cache service instances in module-level `maybeBacktestService` and `maybeMarketDataService` variables in `src/modules/backtests/server/service-singleton.ts` and `src/modules/market-data/server/service-singleton.ts`.
- Database connection state is cached in module-level `maybePostgresPool` and `maybeDb` in `src/modules/db/client.ts`.
- Backtest simulation state is local in-memory data created by `createInitialSimulationState()` in `src/modules/backtests/domain/simulation-state.ts`.
## Key Abstractions
- Purpose: Represent strategy inputs and persisted run outputs.
- Examples: `BacktestDefinitionDraft`, `BacktestDefinitionRecord`, and `BacktestRunRecord` in `src/modules/backtests/domain/backtest-definition.ts`.
- Pattern: Domain draft/record types separate parsed business values from database rows; repositories perform row mapping.
- Purpose: Represent persisted OHLCV candle ranges fetched from a source.
- Examples: `MarketDataChunkDraft`, `MarketDataChunkRecord`, `MarketDataSource`, and `MarketDataInterval` in `src/modules/market-data/domain/market-data-chunk.ts`.
- Pattern: Domain chunk records hold normalized ticker/date/source metadata and parsed `Candle[]`; repository code serializes/deserializes `candlesJson`.
- Purpose: Share OHLCV data across backtests, market data, charts, and providers.
- Examples: `Candle` and `PriceSeriesPoint` in `src/modules/backtests/domain/candle.ts`; candle sorting/filtering in `src/modules/market-data/domain/candle-series.ts`.
- Pattern: One shared candle contract is reused across modules; market-data code owns series transformations.
- Purpose: Simulate bid/ask ladder fills and produce summary metrics plus chart artifacts.
- Examples: `runLadderBacktest()` in `src/modules/backtests/domain/run-ladder-backtest.ts`, `createBidLevels()` and `createAskLevels()` in `src/modules/backtests/domain/ladder-level.ts`, and `calculateBacktestMetrics()` in `src/modules/backtests/domain/metrics.ts`.
- Pattern: Pure function entry with mutation isolated to local `SimulationState`; side effects happen outside the engine.
- Purpose: Bundle use cases behind object methods while allowing test/dependency injection.
- Examples: `createBacktestService()` in `src/modules/backtests/server/backtest-service.ts` and `createMarketDataService()` in `src/modules/market-data/server/market-data-service.ts`.
- Pattern: Factory accepts optional dependencies, defaults to production repositories/providers, and returns an object of async methods.
- Purpose: Hide Drizzle details from services and map persisted values into domain records.
- Examples: `createBacktestRepository()` in `src/modules/backtests/server/backtest-repository.ts`, `createBacktestRunRepository()` in `src/modules/backtests/server/backtest-run-repository.ts`, and `createMarketDataChunkRepository()` in `src/modules/market-data/server/market-data-chunk-repository.ts`.
- Pattern: Repository methods return domain records and handle conversion from database numeric strings, JSON values, and timestamps.
- Purpose: Decouple candle acquisition from backtest execution and market-data creation.
- Examples: `MarketDataProvider` in `src/modules/backtests/server/market-data-provider.ts` and `MarketDataFetchProvider` in `src/modules/market-data/server/market-data-provider.ts`.
- Pattern: Interfaces expose `fetchCandles()`; providers implement sample, stored, and Alpha Vantage sources.
- Purpose: Let page rendering work when database connection details are absent during production build.
- Examples: `getBuildSafeBacktestService()` in `src/modules/backtests/server/build-safe-backtest-service.ts` and `getBuildSafeMarketDataService()` in `src/modules/market-data/server/build-safe-market-data-service.ts`.
- Pattern: Same service shape as production services, with no-op or placeholder return values.
## Entry Points
- Location: `src/app/layout.tsx`
- Triggers: Every Next.js App Router page render.
- Responsibilities: Load fonts, global CSS from `src/app/globals.css`, wrap the page shell, and render `AppFooter`.
- Location: `src/app/page.tsx`
- Triggers: `GET /`
- Responsibilities: Read backtests, recent runs, market-data chunks, and build provenance; render summary stats and recent run table.
- Location: `src/app/backtests/page.tsx`, `src/app/backtests/new/page.tsx`, `src/app/backtests/[id]/page.tsx`, and `src/app/backtests/[id]/edit/page.tsx`
- Triggers: `GET /backtests`, `GET /backtests/new`, `GET /backtests/{id}`, and `GET /backtests/{id}/edit`
- Responsibilities: List saved definitions, render create/edit forms, show run history, and expose the run action.
- Location: `src/app/runs/[runId]/page.tsx`
- Triggers: `GET /runs/{runId}`
- Responsibilities: Load a persisted run, parse summary/chart/fill JSON, render metrics, charts, and fill events.
- Location: `src/app/market-data/page.tsx`, `src/app/market-data/new/page.tsx`, and `src/app/market-data/[id]/page.tsx`
- Triggers: `GET /market-data`, `GET /market-data/new`, and `GET /market-data/{id}`
- Responsibilities: List chunks, render fetch form, show candle summaries, render market data charts, and expose deletion.
- Location: `src/app/api/backtests/route.ts`, `src/app/api/backtests/[id]/route.ts`, `src/app/api/backtests/[id]/run/route.ts`, and `src/app/api/runs/[runId]/route.ts`
- Triggers: Browser form/API calls and route form posts.
- Responsibilities: CRUD definitions, execute runs, list runs, and return JSON errors with appropriate HTTP status codes.
- Location: `src/app/api/market-data/route.ts`, `src/app/api/market-data/[id]/route.ts`, and `src/app/api/market-data/[id]/delete/route.ts`
- Triggers: Browser form/API calls and delete form posts.
- Responsibilities: Create/list/get/delete chunks and redirect after form-based deletion.
- Location: `src/modules/db/migrate.ts`
- Triggers: `bun run db:migrate` from `package.json`.
- Responsibilities: Run Drizzle migrations from `src/modules/db/migrations/` and close the PostgreSQL pool.
## Error Handling
- Validation returns discriminated results from `maybeParseBacktestDefinition()` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts` and `maybeParseMarketDataChunk()` in `src/modules/market-data/domain/market-data-validation.ts`.
- Service methods return `{ ok: true, ... } | { ok: false, ... }` shapes from `src/modules/backtests/server/backtest-service.ts` and `src/modules/market-data/server/market-data-service.ts`.
- Backtest run execution catches provider/engine errors in `src/modules/backtests/server/backtest-service.ts`, stores failed run state through `failRun()`, and returns a failure result.
- Market data fetching catches provider errors in `src/modules/market-data/server/market-data-service.ts` and returns form-level errors.
- Missing pages call `notFound()` in `src/app/backtests/[id]/page.tsx`, `src/app/backtests/[id]/edit/page.tsx`, `src/app/runs/[runId]/page.tsx`, and `src/app/market-data/[id]/page.tsx`.
- API routes return `400`, `404`, or `500` JSON through `NextResponse` in files under `src/app/api/`.
- Database configuration errors throw from `getDbOrThrow()` and `getPostgresPoolOrThrow()` in `src/modules/db/client.ts`.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
