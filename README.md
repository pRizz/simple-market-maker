# simple-market-maker

A full-stack stock ladder backtesting app built with Next.js, Bun, and PostgreSQL.

## What it does

- Create, edit, and delete persisted ladder backtest definitions
- Fetch and manage persisted daily market-data chunks for real tickers
- Run long-only ladder strategy backtests against daily sample market data
- Store every run result durably in PostgreSQL
- Review market candles, run summaries, fill ledgers, equity curves, and drawdowns in the UI
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
- `ALPHA_VANTAGE_API_KEY` — optional key for fetching real ticker candles
- `MARKET_DATA_SOURCE` — `sample` for generated backtest candles, or `stored` to run backtests from downloaded chunks
- `NEXT_PUBLIC_APP_VERSION` — visible build provenance
- `NEXT_PUBLIC_APP_COMMIT` — visible build provenance
- `NEXT_PUBLIC_APP_BUILD_TIME` — visible build provenance
- `PORT` — runtime port

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

1. Set `ALPHA_VANTAGE_API_KEY` when you want to use the real Alpha Vantage provider.
2. Open `/market-data/new`.
3. Choose `alpha_vantage` for real daily candles, or `sample` for deterministic local data.
4. Review downloaded chunks at `/market-data`.
5. Open a chunk detail page to view candlesticks, close price, volume, and raw candle rows.
6. Delete chunks you no longer need from the detail page.

Alpha Vantage's free daily endpoint is best for recent ranges and is rate limited. Persisting chunks avoids repeated calls while you iterate. To run backtests against downloaded chunks, set `MARKET_DATA_SOURCE=stored`; the selected chunk must cover the backtest ticker and date range. The default `sample` setting keeps the existing synthetic backtest behavior.

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
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_APP_COMMIT`
- `NEXT_PUBLIC_APP_BUILD_TIME`
- `PORT` (Railway usually injects this automatically)

### Notes

- Railway does not deploy `docker-compose.yml` directly
- deploy the app from the `Dockerfile`
- add Postgres as a separate Railway service
- the app binds to `::` in production for Railway compatibility

## Current backtest assumptions

The current MVP engine uses:

- single ticker per definition
- daily candles
- long-only inventory model
- deterministic buy-first or sell-first same-candle fill policy
- persisted run history for every execution
- sample synthetic market data provider for development

## Repository verification status

Primary local verification commands:

- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run verify`
