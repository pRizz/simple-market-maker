# simple-market-maker

A full-stack stock ladder backtesting app built with Next.js, Bun, and PostgreSQL.

## What it does

- Create, edit, and delete persisted ladder backtest definitions
- Fetch and manage persisted daily market-data chunks for real tickers
- Run long-only ladder strategy backtests against daily market data
- Store every run result durably in PostgreSQL
- Review market candles, run summaries, fill ledgers, equity curves, and drawdowns in the UI
- Configure provider settings and saved provider keys from `/settings`
- Show visible build provenance in the product chrome

## Tech stack

- Next.js App Router
- Bun for package management and scripts
- PostgreSQL
- Drizzle ORM + SQL migrations
- Tailwind CSS
- Apache ECharts
- Vitest for unit tests

## Local development

### Prerequisites

- Bun 1.3+
- Docker + Docker Compose

### Install dependencies

```bash
bun install
```

### Configure environment

Copy the example environment file if you want a local `.env`:

```bash
cp .env.example .env
```

Key variables:

- `DATABASE_URL` — app database connection
- `PROVIDER_KEYS_ENCRYPTION_SECRET` — non-public server secret used to encrypt saved provider API keys
- `ALPHA_VANTAGE_API_KEY` — optional read-only Alpha Vantage fallback when no enabled saved key exists
- `MARKET_DATA_SOURCE` — `sample` for generated backtest candles, or `stored` to run backtests from downloaded chunks
- `NEXT_PUBLIC_APP_VERSION` — visible build provenance
- `NEXT_PUBLIC_APP_COMMIT` — visible build provenance
- `NEXT_PUBLIC_APP_BUILD_TIME` — visible build provenance
- `PORT` — runtime port

`PROVIDER_KEYS_ENCRYPTION_SECRET` must be set before creating, replacing, validating, or decrypting saved provider keys. Leave `ALPHA_VANTAGE_API_KEY` configured only as a migration fallback; an enabled saved Alpha Vantage key takes precedence for provider-backed fetches.

### Settings page

Open `/settings` to configure:

- the default market-data provider for normal real-data flows
- confirm-before-fetch or silent-fetch behavior for future missing-data workflows
- whether sample/demo data is visible
- Alpha Vantage saved-key create, replace, enable/disable, validate, and delete actions

The settings UI shows safe provider metadata only: provider labels, implementation status, supported intervals, masked key suffixes, enabled state, validation status, timestamps, and whether the `ALPHA_VANTAGE_API_KEY` fallback is configured. It never displays saved provider key values or the fallback value.

### Run with Bun

Start PostgreSQL separately, then run:

```bash
bun run dev
```

### Run migrations

```bash
bun run db:migrate
```

### Run verification

```bash
bun run verify
```

### Run unit tests

```bash
bun run test
```

## Docker workflow

This repository includes a Docker-first local workflow.

### Start the full stack

```bash
docker compose up --build
```

Services:

- app: `http://localhost:3000`
- postgres: `localhost:5432`

The Postgres container uses a named volume so backtests and run history survive container restarts.

## Market data workflow

The Market Data section lets you download daily OHLCV candles for a ticker/date range and store each download as a data chunk.

1. Set `PROVIDER_KEYS_ENCRYPTION_SECRET` for saved provider key workflows.
2. Add and enable an Alpha Vantage saved key at `/settings`, or set `ALPHA_VANTAGE_API_KEY` as the read-only fallback.
3. Open `/market-data/new`.
4. Choose `alpha_vantage` for real daily candles. The `sample` source stays hidden from normal flows unless sample data is enabled in settings.
5. Review downloaded chunks at `/market-data`.
6. Open a chunk detail page to view candlesticks, close price, volume, and raw candle rows.
7. Delete chunks you no longer need from the detail page.

Alpha Vantage's free daily endpoint is best for recent ranges and is rate limited. Persisting chunks avoids repeated calls while you iterate. Saved provider keys take precedence over `ALPHA_VANTAGE_API_KEY`; the fallback remains useful during migration or local setup. To run backtests against downloaded chunks, set `MARKET_DATA_SOURCE=stored`; the selected chunk must cover the backtest ticker and date range.

Sample data remains available for local demos and development, but it is hidden by default and must be explicitly enabled from `/settings`.

### Stop the stack

```bash
docker compose down
```

### Reset local database volume

```bash
docker compose down -v
```

## Railway deployment

Recommended Railway topology:

- one web service deployed from this repository's `Dockerfile`
- one managed PostgreSQL service

### Railway environment variables

Set these on the app service:

- `DATABASE_URL` → reference the managed Postgres connection string
- `PROVIDER_KEYS_ENCRYPTION_SECRET`
- `ALPHA_VANTAGE_API_KEY` if you want a read-only fallback before a saved key is configured
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_APP_COMMIT`
- `NEXT_PUBLIC_APP_BUILD_TIME`
- `PORT` (Railway usually injects this automatically)

### Notes

- Railway does not deploy `docker-compose.yml` directly
- deploy the app from the `Dockerfile`
- add Postgres as a separate Railway service
- the app binds to `::` in production for Railway compatibility

## Security note

This milestone remains a single-admin, no-auth application. Do not expose it publicly without an authentication boundary, network restriction, or equivalent access control. Provider keys are stored encrypted server-side and only safe metadata is returned to the browser, but the app does not yet include multi-user authorization or public SaaS hardening.

## Current backtest assumptions

The current MVP engine uses:

- single ticker per definition
- daily candles
- long-only inventory model
- deterministic buy-first or sell-first same-candle fill policy
- persisted run history for every execution
- real-data-first provider settings with sample synthetic market data gated for development

## Repository verification status

Primary local verification commands:

- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run verify`
