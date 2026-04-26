# Codebase Concerns

**Analysis Date:** 2026-04-26

**Scope:** Whole repository audit excluding generated/vendor directories such as `.git/`, `.next/`, `node_modules/`, `dist/`, `build/`, and `coverage/`.

**Standards inputs:** `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`, and the pinned Bright Builds standards for architecture, code shape, operability, verification, testing, local guidance, and TypeScript/JavaScript.

**Verification sampled:** `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` pass. `bun run build` emits a Next.js workspace-root warning because `next.config.ts` does not pin `turbopack.root`.

## Tech Debt

**Large client form components mix form state, API submission, validation display, and preview UI:**

- Issue: `src/components/backtests/backtest-form.tsx` is 495 lines and its `BacktestForm` component contains most of the file. `src/components/market-data/market-data-form.tsx` is 310 lines and its `MarketDataForm` component owns form state, submission state, field rendering, and side-panel copy.
- Files: `src/components/backtests/backtest-form.tsx`, `src/components/market-data/market-data-form.tsx`
- Impact: Field additions, submission behavior changes, and UI layout edits all touch the same large functions. This increases regression risk and makes focused tests hard to add.
- Fix approach: Extract pure form defaults/mappers, API submit helpers, reusable field controls, and preview/detail panels into smaller modules. Keep `BacktestForm` and `MarketDataForm` as thin composition shells.

**Build-safe service handling is duplicated and environment-driven across pages:**

- Issue: Several pages choose between real services and build-safe stubs with `process.env.DATABASE_URL`, while `src/app/page.tsx` delegates directly to build-safe services. The stubs return empty arrays, `null`, or placeholder records when the database URL is missing.
- Files: `src/modules/backtests/server/build-safe-backtest-service.ts`, `src/modules/market-data/server/build-safe-market-data-service.ts`, `src/app/page.tsx`, `src/app/backtests/page.tsx`, `src/app/market-data/page.tsx`, `src/app/backtests/[id]/page.tsx`, `src/app/market-data/[id]/page.tsx`, `src/app/runs/[runId]/page.tsx`
- Impact: A missing production `DATABASE_URL` can render empty dashboards and `Unavailable` placeholders instead of failing clearly. API routes still call the real singleton services and throw, so page behavior and API behavior diverge.
- Fix approach: Centralize database readiness in one runtime configuration/service factory. Keep build stubs restricted to static generation and fail fast for runtime requests when required infrastructure is absent.

**Persisted backtest artifacts use unvalidated JSON string round-trips:**

- Issue: `src/modules/backtests/server/backtest-run-repository.ts` maps `jsonb` columns to JSON strings with `JSON.stringify`, and `src/app/runs/[runId]/page.tsx` parses those strings with type assertions.
- Files: `src/modules/backtests/server/backtest-run-repository.ts`, `src/app/runs/[runId]/page.tsx`, `src/modules/db/schema.ts`
- Impact: Artifact shape changes, corrupt rows, or partial writes can crash the run detail page at render time. Type assertions do not validate runtime data.
- Fix approach: Keep artifacts as typed objects internally, parse `jsonb` through Zod or domain parsers at the repository boundary, and return a typed success/error state to pages.

**Repository convenience exports bypass service boundaries:**

- Issue: `src/modules/backtests/server/backtest-repository.ts` exports direct helper functions such as `listBacktestDefinitions`, `createBacktestDefinition`, and `deleteBacktestDefinition` alongside the repository factory.
- Files: `src/modules/backtests/server/backtest-repository.ts`
- Impact: Future callers can bypass `src/modules/backtests/server/backtest-service.ts`, skipping service-level validation and orchestration.
- Fix approach: Prefer service functions as the application boundary and keep repository factories internal to server modules unless a direct repository API is explicitly required.

## Known Bugs

**Docker image build references a missing `public/` directory:**

- Symptoms: The runtime stage copies `/app/public`, but the repository has no `public/` directory and the builder stage does not create one.
- Files: `Dockerfile`, `README.md`
- Trigger: `docker compose up --build` or `docker build .` reaches `COPY --from=builder /app/public ./public`.
- Workaround: Create an empty `public/` directory before building, or remove the `COPY --from=builder /app/public ./public` line until static public assets exist.

**Docker workflow does not apply database migrations:**

- Symptoms: `README.md` presents `docker compose up --build` as the full-stack path, while `Dockerfile` starts only `bun server.js` and no `db:migrate` command is detected in `docker-compose.yml`.
- Files: `README.md`, `Dockerfile`, `package.json`, `docker-compose.yml`, `src/modules/db/migrate.ts`
- Trigger: Starting a fresh Postgres volume and using the app before running `bun run db:migrate`.
- Workaround: Run `bun run db:migrate` against the Docker Postgres service before using persisted pages and API routes.

**Invalid calendar dates are accepted through JavaScript date normalization:**

- Symptoms: Date parsing accepts strings like `2024-02-31` because `new Date("2024-02-31T00:00:00.000Z")` normalizes to a valid March date.
- Files: `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/modules/market-data/domain/market-data-validation.ts`, `test/backtests/domain/backtest-domain.test.ts`, `test/market-data/market-data-validation.test.ts`
- Trigger: Posting API JSON with an impossible calendar date rather than using the browser date picker.
- Workaround: None in the API layer. Validate date strings with a strict `YYYY-MM-DD` parser and round-trip check before constructing `Date` objects.

**Backtest win rate can report false wins:**

- Symptoms: `winRatePercent` compares each sell price against the final `simulationState.averageCost`, not the cost basis at each sell. When a position closes and `averageCost` resets to `0`, losing sells can still count as wins.
- Files: `src/modules/backtests/domain/run-ladder-backtest.ts`, `src/modules/backtests/domain/simulation-state.ts`, `test/backtests/domain/backtest-domain.test.ts`
- Trigger: A backtest with a sell below its cost basis followed by a fully closed position.
- Workaround: Use `fillEvent.realizedProfitLoss > 0` for sell win classification, or persist the relevant cost basis on each sell fill event.

**Exposure percent is calculated from price divided by equity:**

- Symptoms: `exposurePercent` sums `priceSeries[index].close / equitySeries[index].value`, so a zero-position account still reports non-zero exposure whenever price and equity are positive.
- Files: `src/modules/backtests/domain/run-ladder-backtest.ts`, `src/modules/backtests/domain/chart-series.ts`, `test/backtests/domain/backtest-domain.test.ts`
- Trigger: Any run with no position or a small position relative to account equity.
- Workaround: Calculate exposure from position market value divided by equity. Carry market value through the chart series or compute exposure before reducing the simulation state to chart artifacts.

**Client form submissions can stay in a submitting state after non-JSON or network failures:**

- Symptoms: `submitBacktest` and `submitMarketDataChunk` call `response.json()` and have no catch path around fetch failures or non-JSON responses.
- Files: `src/components/backtests/backtest-form.tsx`, `src/components/market-data/market-data-form.tsx`
- Trigger: Network failure, an API 500 returning a framework error page, or a malformed JSON response.
- Workaround: Wrap fetch and JSON parsing in `try/catch`, return a form-level error, and reset submission state in a `finally`-style path.

## Security Considerations

**No authentication, authorization, CSRF protection, or rate limiting on mutating routes:**

- Risk: Any reachable user can create, update, delete, and run backtests, delete market data chunks, and consume the server-side Alpha Vantage quota.
- Files: `src/app/api/backtests/route.ts`, `src/app/api/backtests/[id]/route.ts`, `src/app/api/backtests/[id]/run/route.ts`, `src/app/api/market-data/route.ts`, `src/app/api/market-data/[id]/route.ts`, `src/app/api/market-data/[id]/delete/route.ts`, `src/app/backtests/[id]/page.tsx`, `src/app/market-data/[id]/page.tsx`, `README.md`
- Current mitigation: Input parsing exists for backtest definitions and market data requests. No identity or request-origin guard is detected in `src/`.
- Recommendations: Add an authentication boundary before public deployment, enforce per-user authorization on records, protect form POSTs with CSRF or same-site action tokens, and rate-limit run/fetch endpoints.

**Raw operational errors are returned to users:**

- Risk: Provider, database, or repository error messages can be exposed directly in API responses and form errors.
- Files: `src/modules/market-data/server/market-data-service.ts`, `src/modules/backtests/server/backtest-service.ts`, `src/app/api/market-data/route.ts`, `src/app/api/backtests/[id]/run/route.ts`
- Current mitigation: Errors are converted to strings before JSON responses. No structured error taxonomy or redaction boundary is detected.
- Recommendations: Map internal errors to safe user-facing codes/messages, log detailed errors server-side, and keep third-party/provider messages out of public responses unless explicitly sanitized.

**Missing `.dockerignore` can leak local-only files into Docker build context:**

- Risk: Docker build context can include ignored local files such as `.env`, `.next/`, `node_modules/`, logs, and other untracked artifacts because Docker does not honor `.gitignore`.
- Files: `Dockerfile`, `.gitignore`
- Current mitigation: `.gitignore` excludes many generated and secret-like files from Git, but no `.dockerignore` file is present.
- Recommendations: Add `.dockerignore` that excludes `.git/`, `.next/`, `node_modules/`, `.env`, `.env.*`, coverage, logs, local database volumes, and other non-runtime artifacts.

## Performance Bottlenecks

**Market data listing loads every candle payload:**

- Problem: `listChunks()` selects full rows, and `mapChunkRow()` parses `candlesJson` for every chunk even when the list page only needs metadata and `candleCount`.
- Files: `src/modules/market-data/server/market-data-chunk-repository.ts`, `src/app/market-data/page.tsx`, `src/modules/db/schema.ts`
- Cause: Repository methods return one rich `MarketDataChunkRecord` shape for both list and detail use cases.
- Improvement path: Add lightweight list projections that exclude `candlesJson`; parse candle arrays only in `getChunkById()` and stored-data matching paths.

**Backtest run lists stringify full artifact payloads:**

- Problem: `listRecentRuns()` and `listRunsByDefinitionId()` select all run columns, and `mapRunRow()` stringifies summary, chart, fill, and price artifacts for list views.
- Files: `src/modules/backtests/server/backtest-run-repository.ts`, `src/app/page.tsx`, `src/app/backtests/[id]/page.tsx`, `src/modules/db/schema.ts`
- Cause: The same `BacktestRunRecord` shape is used for compact run listings and full run detail rendering.
- Improvement path: Add compact run list queries that select only identifiers, status, timestamps, summary metrics, and `tradeCount`; load JSON artifacts only on `getRunById()`.

**Unbounded date ranges run synchronously in API requests:**

- Problem: Backtest definitions and market data requests validate date order but do not cap range length. Sample data generation creates one candle per calendar day, `runLadderBacktest()` loops all candles, and completed runs persist full chart/fill artifacts in one request.
- Files: `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/modules/market-data/domain/market-data-validation.ts`, `src/modules/backtests/server/sample-market-data-provider.ts`, `src/modules/backtests/domain/run-ladder-backtest.ts`, `src/modules/backtests/server/backtest-service.ts`, `src/modules/backtests/server/backtest-run-repository.ts`
- Cause: No maximum range, candle count, artifact size, background job boundary, or request timeout strategy is implemented.
- Improvement path: Enforce range/candle limits, estimate run size before execution, move long runs to a queued worker, and stream or page large artifacts.

**No pagination for growing workspaces:**

- Problem: Backtest definitions, market data chunks, and run histories are loaded as complete lists except for the recent-run dashboard limit.
- Files: `src/modules/backtests/server/backtest-repository.ts`, `src/modules/backtests/server/backtest-run-repository.ts`, `src/modules/market-data/server/market-data-chunk-repository.ts`, `src/app/backtests/page.tsx`, `src/app/backtests/[id]/page.tsx`, `src/app/market-data/page.tsx`
- Cause: Repository list methods expose unpaginated arrays.
- Improvement path: Add cursor or limit/offset pagination at repositories and list pages; keep dashboard queries explicitly bounded.

## Fragile Areas

**Run detail rendering trusts persisted artifact shape:**

- Files: `src/app/runs/[runId]/page.tsx`, `src/modules/backtests/server/backtest-run-repository.ts`, `src/modules/db/schema.ts`
- Why fragile: `JSON.parse()` failures or shape mismatches throw during server rendering. The page cannot distinguish a missing artifact, corrupt artifact, or schema-version mismatch.
- Safe modification: Introduce versioned artifact schemas and `maybeParse...` helpers that return typed success/failure results. Render a controlled recovery state when artifacts are unavailable.
- Test coverage: No tests cover malformed persisted run artifacts or run detail page behavior.

**Environment-based singletons capture configuration implicitly:**

- Files: `src/modules/db/client.ts`, `src/modules/backtests/server/service-singleton.ts`, `src/modules/market-data/server/service-singleton.ts`, `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`
- Why fragile: `maybeDb`, `maybePostgresPool`, `maybeBacktestService`, and `maybeMarketDataService` are module-level singletons. Runtime changes to `DATABASE_URL`, `MARKET_DATA_SOURCE`, or `ALPHA_VANTAGE_API_KEY` are not reflected after the singleton path is initialized.
- Safe modification: Parse configuration once at process start, pass it into explicit service factories, and expose test-only reset hooks only when needed.
- Test coverage: Tests inject providers for some market-data paths, but no tests cover singleton configuration behavior.

**Database invariants rely on application validation only:**

- Files: `src/modules/db/schema.ts`, `src/modules/db/migrations/0000_initial.sql`, `src/modules/db/migrations/0001_market_data_chunks.sql`, `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/modules/market-data/domain/market-data-validation.ts`
- Why fragile: Tables have `NOT NULL` and enum constraints, but do not enforce positive capital, valid date ordering, non-negative fees, candle count consistency, or JSON artifact shape.
- Safe modification: Add check constraints for durable invariants and keep domain parsers as the user-facing validation layer.
- Test coverage: Unit tests cover some parser rules, but no migration or repository integration tests verify database-level constraints.

**External provider behavior is request-time and quota-sensitive:**

- Files: `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`, `src/modules/market-data/server/market-data-service.ts`, `src/components/market-data/market-data-form.tsx`
- Why fragile: Each Alpha Vantage fetch is synchronous from a user request, has no retry/backoff/rate-limit coordination, and exposes provider rejection as a form error.
- Safe modification: Add per-source rate limiting, backoff, request deduplication, and queued fetch state for provider-backed chunks.
- Test coverage: Unit tests cover parsing and provider error messages, but no tests cover quota exhaustion across concurrent requests.

## Scaling Limits

**Run artifacts stored as large `jsonb` columns in one row:**

- Current capacity: No explicit artifact size limit is enforced.
- Limit: Large date ranges and dense fill histories inflate `summary_json`, `chart_series_json`, `fill_events_json`, and `price_series_json`, making run rows expensive to update, list, transmit, and render.
- Scaling path: Split run artifacts into normalized or chunked tables, keep summary metrics on `backtest_runs`, and page fill/price series data for charts and tables.

**Market data chunks stored as one `jsonb` candle array:**

- Current capacity: No explicit candle count or payload size limit is enforced.
- Limit: Long ticker ranges create large `candles_json` values that are parsed wholesale for list and detail operations.
- Scaling path: Store candles in a child table keyed by chunk/date, add range indexes, and query only the candle window required by charts/backtests.

**Synchronous backtest execution tied to HTTP lifecycle:**

- Current capacity: One run executes inside the API route request.
- Limit: Longer runs or concurrent users can exceed request timeouts and occupy server workers.
- Scaling path: Persist queued run jobs, execute in a worker process, track progress/status, and keep the API route as a job submission endpoint.

## Dependencies at Risk

**Next.js workspace root inference depends on parent-directory lockfiles:**

- Risk: `bun run build` warns that Next.js selected `/Users/peterryszkiewicz/package-lock.json` as the workspace root and detected this repo's `bun.lock` as an additional lockfile.
- Impact: Local builds can behave differently depending on files outside the repository, which affects cache roots and project boundary assumptions.
- Migration plan: Set `turbopack.root` in `next.config.ts` to the repository root so builds are independent of parent directories.

**Bun version is pinned in package metadata and Docker image but not enforced locally:**

- Risk: `package.json` and `Dockerfile` reference Bun `1.3.13`; local command execution can use a different Bun version.
- Impact: Dependency resolution, lockfile behavior, and script execution can drift between local development and Docker/Railway builds.
- Migration plan: Add a checked-in tool-version file or documented bootstrap guard, and use the repo's pinned package manager version in local verification.

## Missing Critical Features

**Access control for deployed use:**

- Problem: The README documents Railway deployment, but the application has no detected login/session layer, authorization checks, CSRF protection, or write-rate limits.
- Blocks: Safe public or shared-team deployment with real data, durable history, and a server-side Alpha Vantage key.

**Automated migration path for Docker and deployment:**

- Problem: `package.json` has `db:migrate`, but the Docker runtime starts the app server directly.
- Blocks: Reliable first-run setup for `docker compose up --build` and Railway deployments.

**Operational logging and observability:**

- Problem: Runtime services mostly return errors to callers; no structured logger, request correlation, metrics, or error tracking integration is detected.
- Blocks: Diagnosing failed fetches, failed runs, slow requests, and data-shape corruption without reproducing issues locally.

**Backtest job lifecycle controls:**

- Problem: Runs execute synchronously and have no queue, cancellation, timeout, progress, or retry state.
- Blocks: Long historical windows, concurrent users, and safe recovery after process restarts during a run.

## Test Coverage Gaps

**Backtest metric edge cases:**

- What's not tested: Win-rate cost basis, exposure percent, repeated fills at the same level, trade-count semantics, fees/slippage edge cases, and max-position behavior.
- Files: `src/modules/backtests/domain/run-ladder-backtest.ts`, `test/backtests/domain/backtest-domain.test.ts`
- Risk: Financial summary metrics can look plausible while being wrong.
- Priority: High

**Strict date parsing and API-invalid inputs:**

- What's not tested: Impossible dates such as `2024-02-31`, malformed JSON request bodies, non-browser API clients, and invalid ticker characters.
- Files: `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/modules/market-data/domain/market-data-validation.ts`, `src/app/api/backtests/route.ts`, `src/app/api/market-data/route.ts`, `test/backtests/domain/backtest-domain.test.ts`, `test/market-data/market-data-validation.test.ts`
- Risk: Invalid inputs can be normalized into unexpected stored records or produce uncontrolled API failures.
- Priority: High

**Route handlers and mutation security:**

- What's not tested: POST/PUT/DELETE route behavior, missing authentication expectations, CSRF-sensitive form POSTs, method-specific status codes, and failure mapping.
- Files: `src/app/api/backtests/route.ts`, `src/app/api/backtests/[id]/route.ts`, `src/app/api/backtests/[id]/run/route.ts`, `src/app/api/market-data/route.ts`, `src/app/api/market-data/[id]/route.ts`, `src/app/api/market-data/[id]/delete/route.ts`
- Risk: Public mutations, malformed requests, and backend failures can regress without detection.
- Priority: High

**Database repository and migration behavior:**

- What's not tested: Drizzle repository mappings, numeric precision conversions, JSONB artifact persistence, migration application, delete cascades, and fresh-database Docker setup.
- Files: `src/modules/backtests/server/backtest-repository.ts`, `src/modules/backtests/server/backtest-run-repository.ts`, `src/modules/market-data/server/market-data-chunk-repository.ts`, `src/modules/db/migrate.ts`, `src/modules/db/migrations/0000_initial.sql`, `src/modules/db/migrations/0001_market_data_chunks.sql`
- Risk: Unit tests can pass while persisted data shape, migrations, or Docker database setup fail.
- Priority: Medium

**Client form failure states:**

- What's not tested: Network failures, non-JSON API errors, duplicate submissions, field-error clearing, and redirect behavior after successful saves.
- Files: `src/components/backtests/backtest-form.tsx`, `src/components/market-data/market-data-form.tsx`
- Risk: Users can get stuck in submitting states or lose useful error messages.
- Priority: Medium

**Performance and size boundaries:**

- What's not tested: Large candle chunks, large run artifact rows, unpaginated list behavior, long date ranges, and concurrent run/fetch requests.
- Files: `src/modules/market-data/server/market-data-chunk-repository.ts`, `src/modules/backtests/server/backtest-run-repository.ts`, `src/modules/backtests/domain/run-ladder-backtest.ts`, `src/modules/backtests/server/backtest-service.ts`, `src/modules/market-data/server/market-data-service.ts`
- Risk: Scaling limits surface only after data volume or concurrent usage grows.
- Priority: Medium

---

_Concerns audit: 2026-04-26_
