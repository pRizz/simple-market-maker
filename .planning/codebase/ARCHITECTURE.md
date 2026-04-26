# Architecture

**Analysis Date:** 2026-04-26

## Pattern Overview

**Overall:** Next.js App Router with feature modules, functional domain core, and server-side service/repository shell.

**Key Characteristics:**

- UI routes live in `src/app/` and delegate business work to services under `src/modules/*/server/`.
- Domain rules live in pure data/type modules under `src/modules/*/domain/` and are reused by server code, client forms, pages, charts, and tests.
- Persistence is centralized through Drizzle schema/client files in `src/modules/db/`, while repositories map between Drizzle rows and domain records.
- Client components submit through colocated API routes in `src/app/api/`; server components read directly from server services.
- Build-safe service wrappers in `src/modules/backtests/server/build-safe-backtest-service.ts` and `src/modules/market-data/server/build-safe-market-data-service.ts` allow static build paths to render when `DATABASE_URL` is unavailable.

## Layers

**Delivery - App Router Pages and API Routes:**

- Purpose: Handle HTTP route entry, page rendering, route params, redirects, and JSON status codes.
- Location: `src/app/`
- Contains: `page.tsx`, `layout.tsx`, and `route.ts` files such as `src/app/page.tsx`, `src/app/backtests/[id]/page.tsx`, `src/app/market-data/[id]/page.tsx`, `src/app/api/backtests/route.ts`, and `src/app/api/market-data/[id]/route.ts`.
- Depends on: Shared components in `src/components/`, domain types/helpers in `src/modules/*/domain/`, and server services in `src/modules/*/server/`.
- Used by: Next.js runtime and browser requests.
- Use this layer for new route handlers, page-level data loading, route params, `notFound()`, `redirect()`, and `NextResponse` mapping.

**Presentation Components:**

- Purpose: Render reusable UI shells, forms, charts, tables, stats, and app chrome.
- Location: `src/components/`
- Contains: Shared UI primitives in `src/components/ui/`, app shell components in `src/components/app-shell/`, feature forms in `src/components/backtests/backtest-form.tsx` and `src/components/market-data/market-data-form.tsx`, and ECharts wrappers in `src/components/charts/`.
- Depends on: React/Next client APIs, domain helpers such as `src/modules/backtests/domain/ladder-level.ts`, domain form types such as `src/modules/backtests/domain/backtest-definition.ts`, and API route URLs.
- Used by: Pages under `src/app/`.
- Use client components only when browser state, `fetch`, `useRouter`, clipboard access, or chart rendering requires `"use client"`.

**Backtests Domain Core:**

- Purpose: Model saved backtests, candles, ladder levels, simulation state, metrics, chart artifacts, validation, and the ladder backtest engine.
- Location: `src/modules/backtests/domain/`
- Contains: Types and pure functions in `src/modules/backtests/domain/backtest-definition.ts`, `src/modules/backtests/domain/candle.ts`, `src/modules/backtests/domain/ladder-level.ts`, `src/modules/backtests/domain/simulation-state.ts`, `src/modules/backtests/domain/metrics.ts`, `src/modules/backtests/domain/chart-series.ts`, and `src/modules/backtests/domain/run-ladder-backtest.ts`.
- Depends on: Other domain modules and `zod` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`.
- Used by: `src/modules/backtests/server/backtest-service.ts`, `src/components/backtests/backtest-form.tsx`, `src/components/charts/backtest-result-charts.tsx`, market-data modules through shared `Candle` types, and tests under `test/backtests/domain/`.
- Use this layer for business rules that can run without Next.js, database access, network calls, or environment variables.

**Market Data Domain Core:**

- Purpose: Model market data chunks, validate market data requests, normalize tickers/notes, and transform candle series for summaries and charts.
- Location: `src/modules/market-data/domain/`
- Contains: `src/modules/market-data/domain/market-data-chunk.ts`, `src/modules/market-data/domain/market-data-validation.ts`, and `src/modules/market-data/domain/candle-series.ts`.
- Depends on: Shared `Candle` and `PriceSeriesPoint` types from `src/modules/backtests/domain/candle.ts`, plus `zod` in `src/modules/market-data/domain/market-data-validation.ts`.
- Used by: `src/modules/market-data/server/market-data-service.ts`, `src/modules/backtests/server/stored-market-data-provider.ts`, `src/app/market-data/[id]/page.tsx`, `src/components/market-data/market-data-form.tsx`, and tests under `test/market-data/`.
- Use this layer for ticker/date normalization, candle filtering/sorting, and chunk-level domain behavior.

**Server Application Services:**

- Purpose: Coordinate validation, repositories, providers, engine execution, error-to-result mapping, and use-case methods.
- Location: `src/modules/*/server/`
- Contains: Backtest orchestration in `src/modules/backtests/server/backtest-service.ts`, market-data orchestration in `src/modules/market-data/server/market-data-service.ts`, singleton factories in `src/modules/backtests/server/service-singleton.ts` and `src/modules/market-data/server/service-singleton.ts`, and build-safe substitutes.
- Depends on: Domain modules, repositories, provider interfaces, and environment-based factory choices.
- Used by: App Router pages and API routes.
- Keep `import "server-only";` in server modules that touch database, environment, network providers, or service singletons.

**Repository and Persistence Adapters:**

- Purpose: Own Drizzle queries, row-to-domain mapping, numeric/string conversion, JSON serialization, and database record creation/update/delete.
- Location: `src/modules/backtests/server/*repository.ts`, `src/modules/market-data/server/market-data-chunk-repository.ts`, and `src/modules/db/`.
- Contains: `src/modules/backtests/server/backtest-repository.ts`, `src/modules/backtests/server/backtest-run-repository.ts`, `src/modules/market-data/server/market-data-chunk-repository.ts`, `src/modules/db/schema.ts`, `src/modules/db/client.ts`, and `src/modules/db/migrate.ts`.
- Depends on: Drizzle ORM, `pg`, table schema exports, and domain record/draft types.
- Used by: Server services and providers such as `src/modules/backtests/server/stored-market-data-provider.ts`.
- Put SQL table definitions only in `src/modules/db/schema.ts`; put row mapping and query methods in the repository that owns the feature.

**External Provider Adapters:**

- Purpose: Fetch or synthesize candle data behind feature-specific provider interfaces.
- Location: `src/modules/backtests/server/` and `src/modules/market-data/server/`
- Contains: `src/modules/backtests/server/market-data-provider.ts`, `src/modules/backtests/server/sample-market-data-provider.ts`, `src/modules/backtests/server/stored-market-data-provider.ts`, `src/modules/market-data/server/market-data-provider.ts`, `src/modules/market-data/server/provider-factory.ts`, `src/modules/market-data/server/sample-market-data-fetch-provider.ts`, and `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
- Depends on: Domain candle and chunk types, repositories for stored chunks, `fetch`, and environment variable names.
- Used by: `src/modules/backtests/server/backtest-service.ts` and `src/modules/market-data/server/market-data-service.ts`.
- Add new providers by implementing the relevant provider interface and wiring source selection through `src/modules/market-data/server/provider-factory.ts` or `src/modules/backtests/server/service-singleton.ts`.

**Build Provenance:**

- Purpose: Expose version, commit, build time, and copyable provenance in product chrome.
- Location: `src/modules/build-info/build-info.ts` and `src/components/app-shell/`
- Contains: `getBuildInfo()` in `src/modules/build-info/build-info.ts`, server wrapper `src/components/app-shell/app-footer.tsx`, and client clipboard UI `src/components/app-shell/provenance-footer.tsx`.
- Depends on: `package.json` version and `NEXT_PUBLIC_APP_*` environment variables.
- Used by: `src/app/layout.tsx` and `src/app/page.tsx`.

## Data Flow

**Backtest Create/Update Flow:**

1. `src/components/backtests/backtest-form.tsx` keeps browser form state and submits JSON to `/api/backtests` or `/api/backtests/[id]`.
2. `src/app/api/backtests/route.ts` or `src/app/api/backtests/[id]/route.ts` reads `request.json()` and calls `getBacktestService()`.
3. `src/modules/backtests/server/backtest-service.ts` parses raw input through `maybeParseBacktestDefinition()` from `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`.
4. `src/modules/backtests/server/backtest-repository.ts` inserts or updates `backtestDefinitionsTable` from `src/modules/db/schema.ts` using `getDbOrThrow()` from `src/modules/db/client.ts`.
5. The API returns an `{ ok: true, backtest }` response or a `400` result with `fieldErrors` and `formErrors`; the form navigates to `/backtests/{id}` after success.

**Backtest Run Flow:**

1. `src/app/backtests/[id]/page.tsx` posts a form to `src/app/api/backtests/[id]/run/route.ts`.
2. `src/modules/backtests/server/backtest-service.ts` loads the definition from `src/modules/backtests/server/backtest-repository.ts`.
3. `src/modules/backtests/server/backtest-run-repository.ts` creates a `running` row in `backtestRunsTable` from `src/modules/db/schema.ts`.
4. The configured `MarketDataProvider` fetches candles: `src/modules/backtests/server/sample-market-data-provider.ts` synthesizes candles, or `src/modules/backtests/server/stored-market-data-provider.ts` loads a matching persisted chunk from `src/modules/market-data/server/market-data-chunk-repository.ts`.
5. `runLadderBacktest()` in `src/modules/backtests/domain/run-ladder-backtest.ts` receives a parsed definition and candles, builds levels/state/metrics, and returns summary plus chart artifacts.
6. `src/modules/backtests/server/backtest-run-repository.ts` completes the run with summary JSON, chart JSON, fill events, price series, and scalar metrics, or marks it failed with an error message.
7. `src/app/runs/[runId]/page.tsx` reads the persisted run through `getBacktestService()`, parses JSON artifacts, and renders `src/components/charts/backtest-result-charts.tsx` plus fill tables.

**Market Data Chunk Flow:**

1. `src/components/market-data/market-data-form.tsx` submits JSON to `src/app/api/market-data/route.ts`.
2. `src/modules/market-data/server/market-data-service.ts` parses input with `maybeParseMarketDataChunk()` from `src/modules/market-data/domain/market-data-validation.ts`.
3. `providerForSource()` in `src/modules/market-data/server/provider-factory.ts` chooses `SampleMarketDataFetchProvider` or `AlphaVantageMarketDataProvider`.
4. `src/modules/market-data/server/alpha-vantage-market-data-provider.ts` validates the external response into `Candle[]`; sample mode delegates to `src/modules/backtests/server/sample-market-data-provider.ts`.
5. `src/modules/market-data/domain/candle-series.ts` sorts and filters candles to the requested date range.
6. `src/modules/market-data/server/market-data-chunk-repository.ts` persists candles as JSON in `marketDataChunksTable` and maps rows back to `MarketDataChunkRecord`.
7. `src/app/market-data/[id]/page.tsx` summarizes the candle series and renders `src/components/charts/market-data-charts.tsx`.

**Server Page Read Flow:**

1. Server pages such as `src/app/page.tsx`, `src/app/backtests/page.tsx`, and `src/app/market-data/page.tsx` select real services when `DATABASE_URL` exists and build-safe services otherwise.
2. Build-safe services return placeholders from `src/modules/backtests/server/build-safe-backtest-service.ts` and `src/modules/market-data/server/build-safe-market-data-service.ts` when the database is unavailable at build time.
3. Rendered pages pass domain records to shared UI components in `src/components/ui/`.

**State Management:**

- Server state is persisted in PostgreSQL tables defined in `src/modules/db/schema.ts`.
- Browser form state is local React state in `src/components/backtests/backtest-form.tsx` and `src/components/market-data/market-data-form.tsx`.
- Service singletons cache service instances in module-level `maybeBacktestService` and `maybeMarketDataService` variables in `src/modules/backtests/server/service-singleton.ts` and `src/modules/market-data/server/service-singleton.ts`.
- Database connection state is cached in module-level `maybePostgresPool` and `maybeDb` in `src/modules/db/client.ts`.
- Backtest simulation state is local in-memory data created by `createInitialSimulationState()` in `src/modules/backtests/domain/simulation-state.ts`.

## Key Abstractions

**Backtest Definition and Run Records:**

- Purpose: Represent strategy inputs and persisted run outputs.
- Examples: `BacktestDefinitionDraft`, `BacktestDefinitionRecord`, and `BacktestRunRecord` in `src/modules/backtests/domain/backtest-definition.ts`.
- Pattern: Domain draft/record types separate parsed business values from database rows; repositories perform row mapping.

**Market Data Chunk Records:**

- Purpose: Represent persisted OHLCV candle ranges fetched from a source.
- Examples: `MarketDataChunkDraft`, `MarketDataChunkRecord`, `MarketDataSource`, and `MarketDataInterval` in `src/modules/market-data/domain/market-data-chunk.ts`.
- Pattern: Domain chunk records hold normalized ticker/date/source metadata and parsed `Candle[]`; repository code serializes/deserializes `candlesJson`.

**Candle and Series Types:**

- Purpose: Share OHLCV data across backtests, market data, charts, and providers.
- Examples: `Candle` and `PriceSeriesPoint` in `src/modules/backtests/domain/candle.ts`; candle sorting/filtering in `src/modules/market-data/domain/candle-series.ts`.
- Pattern: One shared candle contract is reused across modules; market-data code owns series transformations.

**Ladder Engine:**

- Purpose: Simulate bid/ask ladder fills and produce summary metrics plus chart artifacts.
- Examples: `runLadderBacktest()` in `src/modules/backtests/domain/run-ladder-backtest.ts`, `createBidLevels()` and `createAskLevels()` in `src/modules/backtests/domain/ladder-level.ts`, and `calculateBacktestMetrics()` in `src/modules/backtests/domain/metrics.ts`.
- Pattern: Pure function entry with mutation isolated to local `SimulationState`; side effects happen outside the engine.

**Service Factories:**

- Purpose: Bundle use cases behind object methods while allowing test/dependency injection.
- Examples: `createBacktestService()` in `src/modules/backtests/server/backtest-service.ts` and `createMarketDataService()` in `src/modules/market-data/server/market-data-service.ts`.
- Pattern: Factory accepts optional dependencies, defaults to production repositories/providers, and returns an object of async methods.

**Repositories:**

- Purpose: Hide Drizzle details from services and map persisted values into domain records.
- Examples: `createBacktestRepository()` in `src/modules/backtests/server/backtest-repository.ts`, `createBacktestRunRepository()` in `src/modules/backtests/server/backtest-run-repository.ts`, and `createMarketDataChunkRepository()` in `src/modules/market-data/server/market-data-chunk-repository.ts`.
- Pattern: Repository methods return domain records and handle conversion from database numeric strings, JSON values, and timestamps.

**Provider Interfaces:**

- Purpose: Decouple candle acquisition from backtest execution and market-data creation.
- Examples: `MarketDataProvider` in `src/modules/backtests/server/market-data-provider.ts` and `MarketDataFetchProvider` in `src/modules/market-data/server/market-data-provider.ts`.
- Pattern: Interfaces expose `fetchCandles()`; providers implement sample, stored, and Alpha Vantage sources.

**Build-Safe Services:**

- Purpose: Let page rendering work when database connection details are absent during production build.
- Examples: `getBuildSafeBacktestService()` in `src/modules/backtests/server/build-safe-backtest-service.ts` and `getBuildSafeMarketDataService()` in `src/modules/market-data/server/build-safe-market-data-service.ts`.
- Pattern: Same service shape as production services, with no-op or placeholder return values.

## Entry Points

**Root Layout:**

- Location: `src/app/layout.tsx`
- Triggers: Every Next.js App Router page render.
- Responsibilities: Load fonts, global CSS from `src/app/globals.css`, wrap the page shell, and render `AppFooter`.

**Home Dashboard:**

- Location: `src/app/page.tsx`
- Triggers: `GET /`
- Responsibilities: Read backtests, recent runs, market-data chunks, and build provenance; render summary stats and recent run table.

**Backtest Pages:**

- Location: `src/app/backtests/page.tsx`, `src/app/backtests/new/page.tsx`, `src/app/backtests/[id]/page.tsx`, and `src/app/backtests/[id]/edit/page.tsx`
- Triggers: `GET /backtests`, `GET /backtests/new`, `GET /backtests/{id}`, and `GET /backtests/{id}/edit`
- Responsibilities: List saved definitions, render create/edit forms, show run history, and expose the run action.

**Run Detail Page:**

- Location: `src/app/runs/[runId]/page.tsx`
- Triggers: `GET /runs/{runId}`
- Responsibilities: Load a persisted run, parse summary/chart/fill JSON, render metrics, charts, and fill events.

**Market Data Pages:**

- Location: `src/app/market-data/page.tsx`, `src/app/market-data/new/page.tsx`, and `src/app/market-data/[id]/page.tsx`
- Triggers: `GET /market-data`, `GET /market-data/new`, and `GET /market-data/{id}`
- Responsibilities: List chunks, render fetch form, show candle summaries, render market data charts, and expose deletion.

**Backtest API Routes:**

- Location: `src/app/api/backtests/route.ts`, `src/app/api/backtests/[id]/route.ts`, `src/app/api/backtests/[id]/run/route.ts`, and `src/app/api/runs/[runId]/route.ts`
- Triggers: Browser form/API calls and route form posts.
- Responsibilities: CRUD definitions, execute runs, list runs, and return JSON errors with appropriate HTTP status codes.

**Market Data API Routes:**

- Location: `src/app/api/market-data/route.ts`, `src/app/api/market-data/[id]/route.ts`, and `src/app/api/market-data/[id]/delete/route.ts`
- Triggers: Browser form/API calls and delete form posts.
- Responsibilities: Create/list/get/delete chunks and redirect after form-based deletion.

**Migration CLI:**

- Location: `src/modules/db/migrate.ts`
- Triggers: `bun run db:migrate` from `package.json`.
- Responsibilities: Run Drizzle migrations from `src/modules/db/migrations/` and close the PostgreSQL pool.

## Error Handling

**Strategy:** Parse at boundaries, return typed service results for expected validation/use-case failures, throw for missing infrastructure, and convert API failures to JSON status codes.

**Patterns:**

- Validation returns discriminated results from `maybeParseBacktestDefinition()` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts` and `maybeParseMarketDataChunk()` in `src/modules/market-data/domain/market-data-validation.ts`.
- Service methods return `{ ok: true, ... } | { ok: false, ... }` shapes from `src/modules/backtests/server/backtest-service.ts` and `src/modules/market-data/server/market-data-service.ts`.
- Backtest run execution catches provider/engine errors in `src/modules/backtests/server/backtest-service.ts`, stores failed run state through `failRun()`, and returns a failure result.
- Market data fetching catches provider errors in `src/modules/market-data/server/market-data-service.ts` and returns form-level errors.
- Missing pages call `notFound()` in `src/app/backtests/[id]/page.tsx`, `src/app/backtests/[id]/edit/page.tsx`, `src/app/runs/[runId]/page.tsx`, and `src/app/market-data/[id]/page.tsx`.
- API routes return `400`, `404`, or `500` JSON through `NextResponse` in files under `src/app/api/`.
- Database configuration errors throw from `getDbOrThrow()` and `getPostgresPoolOrThrow()` in `src/modules/db/client.ts`.

## Cross-Cutting Concerns

**Logging:** Minimal. `src/modules/db/migrate.ts` writes migration failures with `console.error`; application services mostly communicate errors through return values or persisted failed-run rows.

**Validation:** Zod parses raw request/form data in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/modules/backtests/ui/backtest-form-schema.ts`, and `src/modules/market-data/domain/market-data-validation.ts`. Use these parsing boundaries before calling repositories or domain engines.

**Authentication:** Not detected. No auth middleware, session provider, login routes, or user ownership checks exist in `src/app/` or `src/modules/`.

**Database Access:** Use `getDbOrThrow()` from `src/modules/db/client.ts` inside repositories and migration scripts. Avoid importing Drizzle client logic into pages, client components, or domain modules.

**Environment Selection:** `MARKET_DATA_SOURCE` controls stored versus sample backtest candle providers in `src/modules/backtests/server/service-singleton.ts`; `ALPHA_VANTAGE_API_KEY` is read inside `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`; `DATABASE_URL` controls DB availability and build-safe page behavior.

**Server/Client Boundary:** Server modules that touch DB or provider behavior use `import "server-only";`. Client modules declare `"use client"` in `src/components/backtests/backtest-form.tsx`, `src/components/market-data/market-data-form.tsx`, `src/components/charts/backtest-result-charts.tsx`, `src/components/charts/market-data-charts.tsx`, `src/components/ui/data-table.tsx`, and `src/components/app-shell/provenance-footer.tsx`.

---

_Architecture analysis: 2026-04-26_
