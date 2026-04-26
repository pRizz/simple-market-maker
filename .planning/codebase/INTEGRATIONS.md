# External Integrations

**Analysis Date:** 2026-04-26

## APIs & External Services

**Market Data:**

- Alpha Vantage - Optional real daily OHLCV candle provider for ticker/date-range downloads.
  - SDK/Client: Native `fetch` with `URL` query construction in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`; no vendor SDK is used.
  - Endpoint: `https://www.alphavantage.co/query` from `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
  - Auth: `ALPHA_VANTAGE_API_KEY`.
  - Request shape: `function=TIME_SERIES_DAILY`, `symbol`, `outputsize=compact`, and `apikey` are set in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
  - Error handling: Alpha Vantage error, note, and information payloads are converted to thrown errors by `parseAlphaVantageDailyCandles` in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
  - Selection: `src/modules/market-data/server/provider-factory.ts` uses the Alpha Vantage provider when the submitted market-data source is `alpha_vantage`; otherwise it uses `SampleMarketDataFetchProvider`.

**Internal HTTP API:**

- Next.js route handlers expose JSON endpoints for the browser UI; these are internal application APIs, not third-party integrations.
  - Backtests: `src/app/api/backtests/route.ts`, `src/app/api/backtests/[id]/route.ts`, and `src/app/api/backtests/[id]/run/route.ts`.
  - Runs: `src/app/api/runs/[runId]/route.ts`.
  - Market data: `src/app/api/market-data/route.ts`, `src/app/api/market-data/[id]/route.ts`, and `src/app/api/market-data/[id]/delete/route.ts`.

**Build-Time Assets:**

- Google font definitions are used through `next/font/google` in `src/app/layout.tsx` for Inter and JetBrains Mono; Next.js handles font optimization and serving through the build/runtime pipeline.

## Data Storage

**Databases:**

- PostgreSQL - Primary durable store for backtest definitions, run history, and downloaded market-data chunks.
  - Connection: `DATABASE_URL`.
  - Client: `pg` `Pool` wrapped by Drizzle ORM in `src/modules/db/client.ts`.
  - ORM schema: `src/modules/db/schema.ts`.
  - Migration entrypoint: `src/modules/db/migrate.ts`.
  - Migration files: `src/modules/db/migrations/0000_initial.sql` and `src/modules/db/migrations/0001_market_data_chunks.sql`.
  - Local service: `docker-compose.yml` defines a `postgres:16-alpine` service and a named `postgres_data` volume.
  - Production service: `README.md` recommends a managed PostgreSQL service on Railway.

**File Storage:**

- Local repository files only.
- No S3, GCS, Azure Blob, UploadThing, or similar external file-storage integration was detected in `package.json`, `src/`, or repository config.

**Caching:**

- No external cache service was detected.
- In-process singleton caching is used for service instances in `src/modules/backtests/server/service-singleton.ts` and `src/modules/market-data/server/service-singleton.ts`.
- Persisted market-data chunks in PostgreSQL reduce repeated Alpha Vantage calls through `src/modules/market-data/server/market-data-chunk-repository.ts` and `src/modules/backtests/server/stored-market-data-provider.ts`.

## Authentication & Identity

**Auth Provider:**

- Not detected.
  - No NextAuth/Auth.js, Clerk, Supabase Auth, OAuth, session middleware, or auth tables were detected in `package.json`, `src/`, or `src/modules/db/schema.ts`.
  - API route handlers in `src/app/api/` do not require an authenticated user.

## Monitoring & Observability

**Error Tracking:**

- None detected.
  - No Sentry, Datadog, Honeycomb, OpenTelemetry, Logtail, or similar dependency was detected in `package.json`.

**Logs:**

- Console logging is used for database migration failure reporting in `src/modules/db/migrate.ts`.
- Application route handlers generally return JSON errors rather than logging externally, as shown in `src/app/api/backtests/[id]/route.ts`, `src/app/api/backtests/[id]/run/route.ts`, and `src/app/api/market-data/[id]/route.ts`.

## CI/CD & Deployment

**Hosting:**

- Railway is the documented production target in `README.md`.
- `Dockerfile` is the production build artifact source and runs the Next standalone server with Bun.
- `docker-compose.yml` is a local full-stack workflow, not the production deployment descriptor per `README.md`.

**CI Pipeline:**

- No GitHub Actions workflow files were detected under `.github/workflows`.
- The repo-native verification command is `bun run verify` in `package.json`.
- `.github/pull_request_template.md` defines manual PR verification expectations but no executable CI configuration.

## Environment Configuration

**Required env vars:**

- `DATABASE_URL` - Required for persisted runtime behavior and Drizzle migrations; read by `src/modules/db/client.ts`, `drizzle.config.ts`, and build-safe page/service selection.
- `NEXT_PUBLIC_APP_VERSION` - Public build provenance consumed by `src/modules/build-info/build-info.ts` and supplied as a Docker build arg in `Dockerfile`.
- `NEXT_PUBLIC_APP_COMMIT` - Public build provenance consumed by `src/modules/build-info/build-info.ts` and supplied as a Docker build arg in `Dockerfile`.
- `NEXT_PUBLIC_APP_BUILD_TIME` - Public build provenance consumed by `src/modules/build-info/build-info.ts` and supplied as a Docker build arg in `Dockerfile`.

**Optional env vars:**

- `ALPHA_VANTAGE_API_KEY` - Required only when fetching `alpha_vantage` market-data chunks through `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
- `MARKET_DATA_SOURCE` - Optional backtest data-source selector in `src/modules/backtests/server/service-singleton.ts`; use `stored` to backtest from persisted market-data chunks, otherwise sample data is used.
- `PORT` - Runtime port used by `Dockerfile`, `docker-compose.yml`, and the production start script in `package.json`.

**Secrets location:**

- `.env.example` is present as a template, but contents are intentionally not copied.
- Local secrets should live in `.env` or shell/container environment variables as documented by `README.md`.
- Docker Compose accepts environment values through `docker-compose.yml`; sensitive values should be supplied by the caller environment or local-only env files rather than documented in committed codebase docs.
- Railway app-service variables are documented in `README.md`.

## Webhooks & Callbacks

**Incoming:**

- None detected.
  - No webhook-specific route handlers, signature verification, or callback endpoints were detected under `src/app/api/`.

**Outgoing:**

- Alpha Vantage market-data requests are the only detected outgoing third-party API calls, implemented in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
- No outbound webhook dispatcher, queue, email, payment, or notification provider was detected in `src/` or `package.json`.

---

_Integration audit: 2026-04-26_
