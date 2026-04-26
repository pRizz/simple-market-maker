# Codebase Structure

**Analysis Date:** 2026-04-26

## Directory Layout

```text
simple-market-maker/
|-- src/
|   |-- app/                    # Next.js App Router pages, layouts, API routes, and global CSS
|   |-- components/             # Shared UI, feature forms, charts, and app shell components
|   `-- modules/                # Feature modules, domain logic, server services, providers, DB, build info
|-- test/                       # Vitest tests organized by feature/domain
|-- .github/                    # GitHub metadata such as pull request template
|-- .planning/codebase/         # Generated codebase mapping documents
|-- package.json                # Bun scripts and dependencies
|-- tsconfig.json               # TypeScript config and `@/*` path alias
|-- vitest.config.ts            # Vitest config and test include pattern
|-- drizzle.config.ts           # Drizzle schema/migration config
|-- next.config.ts              # Next standalone output config
|-- Dockerfile                  # Container build/runtime image
|-- docker-compose.yml          # Local app/Postgres stack definition
|-- README.md                   # Product, local development, deployment, and workflow documentation
|-- AGENTS.md                   # Repo-local agent instructions entrypoint
|-- AGENTS.bright-builds.md     # Managed Bright Builds sidecar instructions
`-- standards-overrides.md      # Repo-local standards exceptions
```

## Directory Purposes

**`src/app/`:**

- Purpose: Next.js routing, server page rendering, API endpoint handling, and route-level mutations.
- Contains: Route folders such as `src/app/backtests/`, `src/app/market-data/`, `src/app/runs/`, API folders under `src/app/api/`, `src/app/layout.tsx`, `src/app/page.tsx`, and `src/app/globals.css`.
- Key files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/api/backtests/route.ts`, `src/app/api/backtests/[id]/run/route.ts`, `src/app/api/market-data/route.ts`.
- Add route-level code here when it is tied to a URL, HTTP method, redirect, `notFound()`, or `NextResponse`.

**`src/app/api/`:**

- Purpose: JSON and form-post endpoints used by client components and server-rendered forms.
- Contains: Backtest routes in `src/app/api/backtests/`, run route in `src/app/api/runs/[runId]/route.ts`, and market-data routes in `src/app/api/market-data/`.
- Key files: `src/app/api/backtests/route.ts`, `src/app/api/backtests/[id]/route.ts`, `src/app/api/backtests/[id]/run/route.ts`, `src/app/api/market-data/[id]/delete/route.ts`.
- Keep business logic out of these files; call services from `src/modules/*/server/` and map service results to HTTP responses.

**`src/components/`:**

- Purpose: Reusable React presentation components.
- Contains: App shell in `src/components/app-shell/`, backtest form in `src/components/backtests/`, market-data form in `src/components/market-data/`, charts in `src/components/charts/`, and UI primitives in `src/components/ui/`.
- Key files: `src/components/backtests/backtest-form.tsx`, `src/components/market-data/market-data-form.tsx`, `src/components/charts/backtest-result-charts.tsx`, `src/components/ui/shell.tsx`, `src/components/ui/data-table.tsx`.
- Add shared reusable UI to `src/components/ui/`; add feature-specific UI to `src/components/{feature}/`.

**`src/components/ui/`:**

- Purpose: Generic page shell, table, card, section, and stat components.
- Contains: `src/components/ui/shell.tsx`, `src/components/ui/data-table.tsx`, and `src/components/ui/stat-card.tsx`.
- Key files: `src/components/ui/shell.tsx`.
- Keep these components feature-agnostic. Pass render callbacks or children instead of importing feature services.

**`src/components/charts/`:**

- Purpose: Client-only ECharts wrappers for persisted run artifacts and market data series.
- Contains: `src/components/charts/backtest-result-charts.tsx` and `src/components/charts/market-data-charts.tsx`.
- Key files: `src/components/charts/backtest-result-charts.tsx`.
- Use this directory for chart rendering; prepare series data in domain modules or pages before passing it to charts.

**`src/modules/`:**

- Purpose: Feature and infrastructure modules. This is where business types, pure logic, server services, repositories, providers, database access, and build-info code live.
- Contains: `src/modules/backtests/`, `src/modules/market-data/`, `src/modules/db/`, and `src/modules/build-info/`.
- Key files: `src/modules/backtests/domain/run-ladder-backtest.ts`, `src/modules/backtests/server/backtest-service.ts`, `src/modules/market-data/server/market-data-service.ts`, `src/modules/db/schema.ts`.
- Add feature logic here instead of placing business rules directly in `src/app/` or `src/components/`.

**`src/modules/backtests/domain/`:**

- Purpose: Pure or mostly pure backtest business logic and domain types.
- Contains: Definition types, candle types, ladder level builders, simulation state, metrics, validation, chart series, and the ladder engine.
- Key files: `src/modules/backtests/domain/backtest-definition.ts`, `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/modules/backtests/domain/run-ladder-backtest.ts`, `src/modules/backtests/domain/metrics.ts`, `src/modules/backtests/domain/ladder-level.ts`.
- Put new backtest rules here when they can be tested without DB, network, or Next.js.

**`src/modules/backtests/server/`:**

- Purpose: Server-only backtest orchestration, persistence adapters, provider selection, and service singletons.
- Contains: `src/modules/backtests/server/backtest-service.ts`, `src/modules/backtests/server/backtest-repository.ts`, `src/modules/backtests/server/backtest-run-repository.ts`, `src/modules/backtests/server/sample-market-data-provider.ts`, `src/modules/backtests/server/stored-market-data-provider.ts`, `src/modules/backtests/server/service-singleton.ts`, and `src/modules/backtests/server/build-safe-backtest-service.ts`.
- Key files: `src/modules/backtests/server/backtest-service.ts`, `src/modules/backtests/server/backtest-run-repository.ts`, `src/modules/backtests/server/service-singleton.ts`.
- Use `import "server-only";` for files that touch DB, environment, or server-only providers.

**`src/modules/backtests/ui/`:**

- Purpose: Backtest form schema/types tied to UI form payloads.
- Contains: `src/modules/backtests/ui/backtest-form-schema.ts`.
- Key files: `src/modules/backtests/ui/backtest-form-schema.ts`.
- Use this directory for feature UI schemas that are shared between forms and server API typing; keep domain parsing rules in `src/modules/backtests/domain/` when they express business invariants.

**`src/modules/market-data/domain/`:**

- Purpose: Market-data chunk domain types, request parsing, ticker/notes normalization, and candle series transformations.
- Contains: `src/modules/market-data/domain/market-data-chunk.ts`, `src/modules/market-data/domain/market-data-validation.ts`, and `src/modules/market-data/domain/candle-series.ts`.
- Key files: `src/modules/market-data/domain/market-data-validation.ts`, `src/modules/market-data/domain/candle-series.ts`.
- Put source-neutral candle/chunk logic here.

**`src/modules/market-data/server/`:**

- Purpose: Server-only market-data use cases, chunk repository, fetch provider factory, and external provider adapters.
- Contains: `src/modules/market-data/server/market-data-service.ts`, `src/modules/market-data/server/market-data-chunk-repository.ts`, `src/modules/market-data/server/provider-factory.ts`, `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`, `src/modules/market-data/server/sample-market-data-fetch-provider.ts`, `src/modules/market-data/server/service-singleton.ts`, and `src/modules/market-data/server/build-safe-market-data-service.ts`.
- Key files: `src/modules/market-data/server/market-data-service.ts`, `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`, `src/modules/market-data/server/market-data-chunk-repository.ts`.
- Add new fetch sources by implementing `MarketDataFetchProvider` in this directory and wiring it through `src/modules/market-data/server/provider-factory.ts`.

**`src/modules/db/`:**

- Purpose: Database schema, Drizzle client, migration runner, and migration files.
- Contains: `src/modules/db/schema.ts`, `src/modules/db/client.ts`, `src/modules/db/migrate.ts`, and SQL migrations in `src/modules/db/migrations/`.
- Key files: `src/modules/db/schema.ts`, `src/modules/db/client.ts`, `src/modules/db/migrations/0000_initial.sql`, `src/modules/db/migrations/0001_market_data_chunks.sql`.
- Add table definitions in `src/modules/db/schema.ts`; generate SQL migrations into `src/modules/db/migrations/`.

**`src/modules/build-info/`:**

- Purpose: Server-side build provenance values.
- Contains: `src/modules/build-info/build-info.ts`.
- Key files: `src/modules/build-info/build-info.ts`.
- Keep build/version metadata parsing here and render it through `src/components/app-shell/`.

**`test/`:**

- Purpose: Vitest tests for domain logic, validation, providers, and market-data transformations.
- Contains: Feature directories `test/backtests/` and `test/market-data/`.
- Key files: `test/backtests/domain/backtest-domain.test.ts`, `test/market-data/alpha-vantage-market-data-provider.test.ts`, `test/market-data/stored-market-data-provider.test.ts`.
- Add tests under the same feature name and mirror the source concern where practical.

**`.planning/codebase/`:**

- Purpose: Generated codebase intelligence documents for planning/execution agents.
- Contains: `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/STRUCTURE.md`.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.
- Only codebase mapping outputs should be written here.

## Key File Locations

**Entry Points:**

- `src/app/layout.tsx`: Root layout, fonts, global CSS, page wrapper, and footer.
- `src/app/page.tsx`: Home dashboard for saved backtests, recent runs, market data chunks, and build info.
- `src/app/backtests/page.tsx`: Backtest list and latest runs page.
- `src/app/backtests/new/page.tsx`: Backtest creation page.
- `src/app/backtests/[id]/page.tsx`: Backtest detail, parameters, run history, and run form.
- `src/app/backtests/[id]/edit/page.tsx`: Backtest edit page.
- `src/app/runs/[runId]/page.tsx`: Run result detail page.
- `src/app/market-data/page.tsx`: Market-data chunk list page.
- `src/app/market-data/new/page.tsx`: Market-data fetch page.
- `src/app/market-data/[id]/page.tsx`: Market-data chunk detail page.
- `src/modules/db/migrate.ts`: Migration CLI entrypoint.

**API Routes:**

- `src/app/api/backtests/route.ts`: List and create backtest definitions.
- `src/app/api/backtests/[id]/route.ts`: Get, update, and delete one backtest definition.
- `src/app/api/backtests/[id]/run/route.ts`: Execute a saved backtest.
- `src/app/api/runs/[runId]/route.ts`: Read one persisted run.
- `src/app/api/market-data/route.ts`: List and create market-data chunks.
- `src/app/api/market-data/[id]/route.ts`: Get and delete one market-data chunk.
- `src/app/api/market-data/[id]/delete/route.ts`: Form-post deletion endpoint that redirects to `/market-data`.

**Configuration:**

- `package.json`: Bun scripts, package manager pin, dependencies, and verification command.
- `tsconfig.json`: Strict TypeScript config and `@/*` path alias to `src/*`.
- `vitest.config.ts`: Vitest alias and `test/**/*.test.ts` include pattern.
- `drizzle.config.ts`: Drizzle schema path `src/modules/db/schema.ts` and migrations path `src/modules/db/migrations`.
- `next.config.ts`: Next.js standalone output.
- `eslint.config.mjs`: ESLint setup.
- `postcss.config.mjs`: Tailwind PostCSS plugin setup.
- `.env.example`: Environment configuration example file present; do not copy or quote secret values from local `.env` files.

**Core Logic:**

- `src/modules/backtests/domain/run-ladder-backtest.ts`: Ladder backtest engine.
- `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`: Backtest request parsing and validation.
- `src/modules/backtests/domain/ladder-level.ts`: Bid/ask level construction and ladder preview rows.
- `src/modules/backtests/domain/metrics.ts`: Currency/percent rounding, drawdown series, and summary metric calculations.
- `src/modules/market-data/domain/market-data-validation.ts`: Market-data request parsing and validation.
- `src/modules/market-data/domain/candle-series.ts`: Candle sorting, date filtering, summary, and chart series conversion.
- `src/modules/build-info/build-info.ts`: Build provenance parsing.

**Services and Persistence:**

- `src/modules/backtests/server/backtest-service.ts`: Backtest CRUD and run orchestration service.
- `src/modules/backtests/server/backtest-repository.ts`: Backtest definition repository.
- `src/modules/backtests/server/backtest-run-repository.ts`: Backtest run repository.
- `src/modules/backtests/server/service-singleton.ts`: Runtime backtest service singleton and `MARKET_DATA_SOURCE` provider selection.
- `src/modules/backtests/server/build-safe-backtest-service.ts`: Placeholder backtest service for build-time database absence.
- `src/modules/market-data/server/market-data-service.ts`: Market-data chunk creation/list/get/delete service.
- `src/modules/market-data/server/market-data-chunk-repository.ts`: Market-data chunk repository and candle JSON mapping.
- `src/modules/market-data/server/provider-factory.ts`: Market-data source to provider mapping.
- `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`: Alpha Vantage response parsing and fetching.
- `src/modules/market-data/server/build-safe-market-data-service.ts`: Placeholder market-data service for build-time database absence.
- `src/modules/db/schema.ts`: Drizzle tables and enums.
- `src/modules/db/client.ts`: PostgreSQL pool and Drizzle client factory.

**Testing:**

- `test/backtests/domain/backtest-domain.test.ts`: Backtest validation, ladder levels, and engine behavior.
- `test/market-data/market-data-validation.test.ts`: Market-data parser behavior.
- `test/market-data/candle-series.test.ts`: Candle sorting/filtering/summary behavior.
- `test/market-data/alpha-vantage-market-data-provider.test.ts`: Alpha Vantage provider parsing/fetch behavior.
- `test/market-data/stored-market-data-provider.test.ts`: Stored market-data provider behavior.

## Naming Conventions

**Files:**

- Use lowercase kebab-case for source files: `src/modules/backtests/domain/run-ladder-backtest.ts`, `src/modules/market-data/server/market-data-service.ts`, `src/components/backtests/backtest-form.tsx`.
- Next.js route files use framework names: `page.tsx`, `layout.tsx`, and `route.ts`.
- Dynamic route directories use bracket names: `src/app/backtests/[id]/page.tsx`, `src/app/runs/[runId]/page.tsx`, `src/app/market-data/[id]/route.ts`.
- Test files use `*.test.ts` under `test/`: `test/market-data/candle-series.test.ts`.
- Database migrations use numbered SQL files under `src/modules/db/migrations/`: `src/modules/db/migrations/0000_initial.sql`.

**Directories:**

- Feature modules use plural kebab-case: `src/modules/backtests/`, `src/modules/market-data/`.
- Feature modules split by concern: `domain/`, `server/`, and optional `ui/`.
- Component feature directories match product areas: `src/components/backtests/`, `src/components/market-data/`, `src/components/charts/`.
- Shared primitives live under generic names: `src/components/ui/`, `src/components/app-shell/`.

**Exports and Symbols:**

- Types use PascalCase: `BacktestDefinitionDraft`, `BacktestRunRecord`, `MarketDataChunkRecord`, `MarketDataFetchProvider`.
- Factory functions use `create*`: `createBacktestService`, `createBacktestRepository`, `createMarketDataChunkRepository`.
- Singleton accessors use `get*`: `getBacktestService`, `getMarketDataService`, `getDbOrThrow`.
- Nullable/optional internals use `maybe*`: `maybeBacktest`, `maybeChunk`, `maybeDb`, `maybePostgresPool`.
- Parsers returning optional-style results use `maybeParse*`: `maybeParseBacktestDefinition`, `maybeParseMarketDataChunk`.

## Where to Add New Code

**New Backtest Business Rule:**

- Primary code: `src/modules/backtests/domain/`
- Tests: `test/backtests/domain/`
- Use existing pure helpers such as `src/modules/backtests/domain/metrics.ts` and `src/modules/backtests/domain/ladder-level.ts`; keep database and network access out of the domain layer.

**New Backtest Use Case:**

- Primary code: `src/modules/backtests/server/backtest-service.ts` when it coordinates existing repositories/providers.
- New persistence behavior: `src/modules/backtests/server/backtest-repository.ts` or `src/modules/backtests/server/backtest-run-repository.ts`.
- Route/API exposure: `src/app/backtests/...` for pages or `src/app/api/backtests/.../route.ts` for HTTP endpoints.
- Tests: domain tests under `test/backtests/domain/`; provider/service tests can live under `test/backtests/` or a new `test/backtests/server/` directory.

**New Backtest Page or Action:**

- Page: `src/app/backtests/{route}/page.tsx` or a dynamic route folder under `src/app/backtests/[id]/`.
- API route: `src/app/api/backtests/{route}/route.ts`.
- Shared UI: `src/components/backtests/` for feature-specific components or `src/components/ui/` for generic components.

**New Market Data Domain Rule:**

- Primary code: `src/modules/market-data/domain/`
- Tests: `test/market-data/`
- Use `src/modules/market-data/domain/candle-series.ts` for source-neutral candle transformations.

**New Market Data Provider:**

- Implementation: `src/modules/market-data/server/{provider-name}-market-data-provider.ts`
- Interface: `src/modules/market-data/server/market-data-provider.ts`
- Factory wiring: `src/modules/market-data/server/provider-factory.ts`
- Source type: update `marketDataSources` in `src/modules/market-data/domain/market-data-chunk.ts` and corresponding Drizzle enum in `src/modules/db/schema.ts`.
- Tests: add provider parsing/fetch tests under `test/market-data/`.

**New Persisted Entity or Table:**

- Schema: `src/modules/db/schema.ts`
- Migration: `src/modules/db/migrations/`
- Repository: `src/modules/{feature}/server/{entity}-repository.ts`
- Service orchestration: `src/modules/{feature}/server/{feature}-service.ts`
- Route exposure: `src/app/api/{feature}/route.ts` or nested `route.ts` files.

**New Shared Component:**

- Feature-specific UI: `src/components/backtests/` or `src/components/market-data/`
- Generic UI primitive: `src/components/ui/`
- App-wide chrome: `src/components/app-shell/`
- Chart UI: `src/components/charts/`

**New Utility:**

- Domain-specific helper: colocate under `src/modules/{feature}/domain/`.
- Server-only helper: colocate under `src/modules/{feature}/server/` and include `import "server-only";` when it touches DB, environment, or server-only APIs.
- Cross-feature business value: prefer a dedicated existing module such as `src/modules/build-info/` or create a narrowly named module under `src/modules/`.

**New Test:**

- Backtest domain test: `test/backtests/domain/{concern}.test.ts`
- Market-data test: `test/market-data/{concern}.test.ts`
- Use the `@/*` alias from `vitest.config.ts`.

## Special Directories

**`src/modules/db/migrations/`:**

- Purpose: Drizzle SQL migrations and metadata.
- Generated: Yes, by Drizzle Kit.
- Committed: Yes.
- Use `bun run db:generate` from `package.json` after schema changes.

**`.next/`:**

- Purpose: Next.js build/dev output.
- Generated: Yes.
- Committed: No.
- Do not scan or edit for source changes.

**`node_modules/`:**

- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.
- Do not scan or edit for source changes.

**`.planning/codebase/`:**

- Purpose: Codebase mapping output documents.
- Generated: Yes, by mapping workflow.
- Committed: Project-dependent.
- Write only assigned mapping files here.

**`.github/`:**

- Purpose: GitHub repository metadata.
- Generated: No.
- Committed: Yes.
- Contains `.github/pull_request_template.md` for pull request guidance.

**Root Configuration Files:**

- Purpose: Tooling, local development, container build, and deployment configuration.
- Generated: No for `package.json`, `tsconfig.json`, `next.config.ts`, `drizzle.config.ts`, `vitest.config.ts`, `Dockerfile`, and `docker-compose.yml`; generated/lock-managed for `bun.lock`.
- Committed: Yes.
- Update these files only when changing scripts, dependencies, build output, tests, DB migration config, or container behavior.

---

_Structure analysis: 2026-04-26_
