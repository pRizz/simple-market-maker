# Stack Research: Real-Data-First Backtesting Milestone

**Project:** Simple Market Maker
**Research type:** Stack dimension
**Researched:** 2026-04-26
**Overall confidence:** MEDIUM-HIGH

## Recommendation

Keep the existing Bun, Next.js App Router, TypeScript, PostgreSQL, Drizzle, Tailwind, and ECharts stack. Do not use this milestone to upgrade the core framework, replace charts, adopt a new ORM, add authentication, or introduce a job queue.

Add Twelve Data as the researched second API provider. Add CSV import as the custom/offline data path. Keep Alpha Vantage, but stop treating it as enough for real-data-first workflows because its current official free limit is 25 requests per day. Defer Polygon/Massive as the paid/professional upgrade path, avoid Finnhub for this milestone because its own stock-candle schema marks the endpoint as premium, and do not build a Stooq network provider.

Use Magic UI selectively as source-copied UI polish, not as a design-system rewrite. The app is a quiet trading research workstation, so Magic UI should improve cards, fetch progress, empty states, and metric presentation without adding marketing-page effects.

## Brownfield Baseline

| Area                    | Keep                                      | Why                                                                                                      |
| ----------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime/package manager | Bun 1.3.13                                | Already pinned in `package.json` and `bun.lock`; Docker uses the same runtime.                           |
| App framework           | Next.js 16.2.4 App Router + React 19.2    | Existing pages/API routes already match this architecture.                                               |
| Language                | TypeScript 5.9.3                          | Existing strict TS setup is sufficient for provider adapters and typed repositories.                     |
| Persistence             | PostgreSQL + Drizzle ORM 0.44.7           | Existing backtests, runs, and chunks are already persisted through Drizzle repositories.                 |
| Styling                 | Tailwind CSS 4.1.16                       | Existing UI is Tailwind-first; Magic UI components are Tailwind-compatible.                              |
| Charts                  | ECharts 6.0.0 + `echarts-for-react` 3.0.2 | Already handles candle, equity, volume, and drawdown charts; add source labels rather than replacing it. |
| Validation              | Zod 4.1.12                                | Existing boundary parsing pattern should extend to provider settings, key CRUD, and CSV import.          |
| HTTP clients            | Native `fetch`                            | Vendor SDKs add little for simple REST candle endpoints and increase dependency surface.                 |

Material local guidance: keep functional core / imperative shell boundaries, parse external/provider data at boundaries, and verify implementation with `bun run verify`.

## Provider Decision

### Implement: Twelve Data

**Decision:** Add Twelve Data as the second API provider for this milestone.

**Confidence:** MEDIUM-HIGH. Official pricing and docs support the fit; final validation should include a real Basic key against the user's expected ticker set because free-plan symbol coverage can still surprise.

**Why it fits:**

- The Basic plan is free and currently lists 8 API credits per minute with 800 per day, which is materially more useful than Alpha Vantage's current free limit for manual backtest workflows.
- `/time_series` costs 1 API credit per symbol, supports `1day`, `1week`, and `1month` intervals, accepts `start_date` and `end_date`, and supports `outputsize` up to 5000.
- The endpoint exposes an explicit `adjust` parameter with `all`, `splits`, `dividends`, and `none`, defaulting to `splits`. This maps cleanly to the milestone requirement to show adjusted/unadjusted status.
- The response metadata includes useful provenance fields such as symbol, interval, currency, exchange timezone, exchange, MIC code, and instrument type.
- It supports JSON and CSV response formats, but this app should use JSON for API provider fetches and reserve CSV handling for user imports.

**Integration cost:** Medium.

Use native `fetch` in a new server adapter such as `src/modules/market-data/server/twelve-data-market-data-provider.ts`. Map existing daily OHLCV candles from Twelve Data string values into the shared `Candle` type. Persist the provider response metadata in `sourceMetadata`. Handle provider `status` and error messages explicitly instead of treating all HTTP 200 responses as valid candles.

**Provider defaults for v1:**

| Setting            | Recommendation                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Provider id        | `twelve_data`                                                                                        |
| Endpoint           | `https://api.twelvedata.com/time_series`                                                             |
| Interval mapping   | app `daily` -> Twelve Data `1day`                                                                    |
| Date range         | Use `start_date` and `end_date`; omit `outputsize` when both dates are set.                          |
| Order              | Request `order=asc` if supported for the endpoint; otherwise sort in the domain layer after parsing. |
| Adjustment         | Default to `splits`; store explicit user/provider adjustment choice on the chunk.                    |
| Currency           | Persist `meta.currency`, default display to USD when absent.                                         |
| Rate-limit posture | One fetch per submitted request is fine for v1; show quota/provider errors directly.                 |

### Keep: Alpha Vantage

**Decision:** Keep the existing provider, but migrate key handling into provider API-key CRUD with environment fallback.

**Confidence:** HIGH. The app already has the adapter; Alpha Vantage's official premium page currently says the standard free API usage limit is 25 requests per day.

**Why:** Alpha Vantage is already implemented and useful as a comparison/source option. It should not remain the only real-data path because the current free limit makes silent/confirm missing-data fetches feel unreliable after a small number of chunks.

### Defer: Polygon/Massive

**Decision:** Do not implement Polygon/Massive as the second provider in this milestone unless the roadmap explicitly accepts a paid-provider dependency.

**Confidence:** MEDIUM-HIGH.

**Why:** Polygon's pricing now redirects to Massive. Its free Stocks Basic offer is strong quality-wise, but it currently lists 5 API calls per minute, 2 years of historical data, and end-of-day data. That is a worse free default for backtesting ranges than Twelve Data. The paid path is attractive: Stocks Starter currently lists unlimited API calls and 5 years of historical data, and the REST custom bars endpoint has a clean OHLC range shape with `adjusted`, `sort`, and `limit`.

Treat Polygon/Massive as the next paid/quality upgrade provider, especially if the product narrows to US equities and needs stronger licensing/provenance.

### Avoid: Finnhub

**Decision:** Do not add Finnhub for stock candles in this milestone.

**Confidence:** HIGH for this decision.

**Why:** Finnhub's official docs/schema for `/stock/candle` marks the stock-candles endpoint as "Premium Access Required". Its broader marketing mentions free APIs, but this specific milestone needs historical OHLCV candles. A provider that appears free but blocks the required endpoint is a poor fit for a low-friction second provider.

### CSV Import, Not Network Provider: Stooq

**Decision:** Do not build a Stooq HTTP provider. Support Stooq-like files through CSV import.

**Confidence:** MEDIUM. The Stooq conclusion is based on QuantStart reference context rather than a formal Stooq API contract.

**Why:** Stooq is useful as free historical data, but the cited research states there is no API, downloads are CSV/zip oriented, some flows involve CAPTCHA, ticker nomenclature differs, and close prices may already be adjusted. That is exactly the shape of a user-controlled import workflow, not a reliable server-side provider adapter.

## Data Source Model

Extend the existing market-data model rather than creating a separate provider subsystem.

| Concept            | Recommendation                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MarketDataSource` | Add `twelve_data` and `csv_import`; keep `alpha_vantage` and `sample`. Leave `polygon` reserved but unimplemented.                                                |
| Chunk identity     | Persist provider, ticker, requested start/end, actual min/max candle dates, interval, adjustment mode, currency, fetched/imported timestamp, and source metadata. |
| Separate fetches   | Allow separate rows for repeated fetches even with the same ticker/range/provider; choose "latest eligible row" only in read/query logic.                         |
| Source metadata    | Store provider response metadata and import metadata as typed JSON at repository boundaries.                                                                      |
| Display labels     | Build chart labels from persisted chunk source fields, not from current environment variables.                                                                    |
| Sample data        | Keep `sample` as explicit demo/development data, never the implicit fallback for normal backtests.                                                                |

Provider selection should move out of the `MARKET_DATA_SOURCE` environment switch and into persisted app/provider settings. Keep the env var only as a temporary compatibility fallback during migration.

## Provider Keys and Settings

Use PostgreSQL plus app-level encryption. Do not add a hosted secret manager or auth provider for this single-admin milestone.

| Need              | Stack choice                                                                                                      | Why                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Provider key CRUD | New Drizzle table, server-only repository/service, App Router settings pages                                      | Matches existing architecture and avoids introducing a settings service dependency. |
| Key encryption    | `node:crypto` AES-GCM with `PROVIDER_KEYS_ENCRYPTION_SECRET`                                                      | Standard library, no new dependency, enough for single-admin at-rest protection.    |
| Key display       | Store/display provider name, enabled status, last 4 characters, created/updated dates, and last validation result | Lets the UI manage keys without exposing raw values after save.                     |
| App settings      | Drizzle table for default provider, missing-data behavior, default adjustment mode, and sample-data visibility    | Keeps roadmap settings durable and testable.                                        |
| Secret exposure   | `server-only` modules and non-public env names                                                                    | Provider keys must never use `NEXT_PUBLIC_*` names or client props.                 |

Recommended tables:

| Table               | Purpose                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `provider_api_keys` | Provider id, encrypted key, iv, auth metadata, last4, enabled flag, validation status, timestamps.              |
| `app_settings`      | Single-row settings for default provider, missing-data behavior, default adjustment mode, and sample-data gate. |

## CSV Import Stack

**Decision:** Add `csv-parse`.

**Confidence:** HIGH.

Use `csv-parse@6.2.1` for server-side CSV parsing. It is MIT licensed, current on npm, and implements Node stream parsing. Avoid hand-rolled CSV parsing because quoted fields, delimiters, headers, and malformed rows are easy to mishandle.

Initial import can read modest uploaded files through a Next route handler using `request.formData()` and parse the uploaded text. Keep streaming support in reserve for larger files; do not add object storage for v1.

CSV import should normalize into the same `MarketDataChunkDraft` path as providers:

| Field            | Recommendation                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Required columns | `date`, `open`, `high`, `low`, `close`; `volume` optional but preferred.                  |
| Optional columns | `adjusted_close`, `source`, `currency`, `timezone`, `notes`.                              |
| Validation       | Zod row validation plus domain candle sorting/filtering.                                  |
| Source id        | `csv_import`.                                                                             |
| Adjustment       | Ask user to declare `adjusted`, `unadjusted`, or `unknown`; do not infer silently.        |
| Provenance       | Persist filename, row count, import timestamp, column mapping, and declared source notes. |

## Magic UI Stack

**Decision:** Use selected Magic UI components by copying component source into this repo, then adapting them to the existing app shell.

**Confidence:** MEDIUM-HIGH.

Magic UI's official installation path uses the shadcn CLI, and its docs describe the same install process as shadcn/ui. This repo does not currently have `components.json`, shadcn primitives, `@/lib/utils`, `clsx`, `tailwind-merge`, `motion`, or `next-themes`. A full shadcn initialization would be larger than this milestone needs.

Recommended dependency surface:

| Package                    | Current npm version checked | Add?     | Why                                                                                                         |
| -------------------------- | --------------------------: | -------- | ----------------------------------------------------------------------------------------------------------- |
| `motion`                   |                     12.38.0 | Yes      | Required by Magic UI components such as Magic Card.                                                         |
| `lucide-react`             |                      1.11.0 | Yes      | Use for quiet operational icons in buttons, settings, provider status, imports, and chart labels.           |
| `clsx`                     |                       2.1.1 | Yes      | Small className utility for copied UI components.                                                           |
| `tailwind-merge`           |                       3.5.0 | Yes      | Prevents copied Tailwind components from accumulating conflicting classes.                                  |
| `next-themes`              |                       0.4.6 | Defer    | Only add if a real theme setting is implemented; do not add it just because the Magic Card demo imports it. |
| `class-variance-authority` |                       0.7.1 | Defer    | Useful for a full shadcn variant system, unnecessary for targeted polish.                                   |
| `shadcn` CLI               |                       4.5.0 | CLI only | Use through `bunx` if needed; do not add as a runtime dependency.                                           |

Preferred install command for this milestone:

```bash
bun add csv-parse motion lucide-react clsx tailwind-merge
```

If a Magic UI component is copied from the registry and imports `@/lib/utils`, add a tiny local `cn()` helper using `clsx` and `tailwind-merge`. If a copied component imports `next-themes`, remove that dependency and pass explicit colors from the app unless the settings phase intentionally adds theme support.

Recommended Magic UI components:

| Component                   | Use                                                                             | Notes                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Magic Card                  | Provider status cards, selected market-data source cards, key validation panels | Use low-opacity neutral/green/amber gradients. Avoid the high-saturation default purple/pink look. |
| Number Ticker               | Volatility, drawdown, return, and candle-count metrics                          | Use only for scalar metric transitions; respect reduced-motion preferences if needed.              |
| Animated List               | Fetch progress, recent import/fetch events, validation warnings                 | Good fit for a compact operational activity feed.                                                  |
| Blur Fade                   | Empty states and small section entrances                                        | Keep durations short and do not animate dense data tables row-by-row.                              |
| Border Beam or Shine Border | Active fetch state or "real data selected" emphasis                             | Use sparingly; not for every card.                                                                 |

Avoid for this app: Marquee, Globe, Dock, Orbiting Circles, Meteors, Confetti, Particles, Retro Grid, Animated Grid Pattern, Aurora Text, Rainbow Button, Shimmer Button, and marketing template blocks.

## What Not To Add

| Do not add                                                      | Reason                                                                                                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Prisma or another ORM                                           | Drizzle is already in place and typed repository boundaries are the right extension point.                            |
| TanStack Query/global client cache                              | Current pages/API routes can handle settings, fetch confirmation, and import flows without a new state layer.         |
| Redis, BullMQ, Temporal, or background workers                  | Missing-data fetches are small provider calls in v1; show client pending/progress state and persist resulting chunks. |
| Vendor SDKs for Twelve Data, Alpha Vantage, Polygon, or Finnhub | REST calls are simple and native `fetch` keeps provider adapters transparent.                                         |
| NextAuth/Clerk/Supabase Auth                                    | Single-admin assumption remains explicit for this milestone.                                                          |
| S3/UploadThing/object storage                                   | CSV import can parse uploaded files directly and persist normalized candles in PostgreSQL.                            |
| A second charting library                                       | ECharts already covers the charting surface; extend labels and legends instead.                                       |
| `pandas`, Python tooling, or yfinance                           | This is a Bun/Next app; unofficial data scraping does not belong in the runtime stack.                                |
| Stooq HTTP scraping                                             | No formal API contract and awkward download workflow; support Stooq-like data through CSV import instead.             |

## Roadmap Implications

Recommended phase order from a stack perspective:

1. **Data provenance schema and settings foundation** - Add provider/source fields, settings tables, key CRUD tables, and encryption utilities before changing fetch UX.
2. **Twelve Data provider adapter** - Implement provider fetch, parsing, metadata persistence, and provider error display behind the existing service boundary.
3. **Real-data-first backtest flow** - Use persisted settings and provider availability to implement confirm/silent missing-data fetch behavior.
4. **CSV import** - Normalize custom files into the same chunk repository path after the source model is stable.
5. **Metrics and chart labels** - Add volatility metrics in the pure domain layer and source labels in ECharts components.
6. **Magic UI polish** - Apply selected copied components after data-source states exist, so polish clarifies real workflow states.

## Confidence Assessment

| Area                       | Confidence  | Notes                                                                                                               |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Keep core stack            | HIGH        | Verified against local codebase map and `package.json`.                                                             |
| Twelve Data recommendation | MEDIUM-HIGH | Official pricing/docs fit the use case; validate target tickers on a real Basic key.                                |
| Polygon/Massive defer      | MEDIUM-HIGH | Official pricing/docs make it a good paid path, not the best free v1 default.                                       |
| Finnhub avoid              | HIGH        | Official stock-candle schema marks the required endpoint premium.                                                   |
| Stooq as CSV-only          | MEDIUM      | Based on QuantStart reference context rather than an official API page.                                             |
| CSV parser choice          | HIGH        | `csv-parse` is current, MIT licensed, typed, and server-suitable.                                                   |
| Magic UI dependency plan   | MEDIUM-HIGH | Official docs confirm shadcn-style copy/install; exact component imports should be rechecked during implementation. |

## Sources

- Local project context: `.planning/PROJECT.md`, `.planning/codebase/STACK.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/INTEGRATIONS.md`, `package.json`.
- Bright Builds local guidance: `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`; canonical standards read from `standards/index.md`, `standards/core/architecture.md`, `standards/core/verification.md`, and `standards/languages/typescript-javascript.md`.
- Alpha Vantage premium/free limit: https://www.alphavantage.co/premium/
- Twelve Data pricing: https://twelvedata.com/pricing
- Twelve Data API docs: https://twelvedata.com/docs
- Twelve Data historical-date behavior: https://support.twelvedata.com/en/articles/5214728-getting-historical-data
- Polygon/Massive pricing: https://polygon.io/pricing/ and https://massive.com/pricing
- Polygon/Massive stock docs: https://polygon.io/docs/rest/stocks/overview/ and https://polygon.io/docs/rest/stocks/aggregates/custom-bars
- Finnhub stock candles: https://finnhub.io/docs/api/stock-candles
- Stooq reference context: https://www.quantstart.com/articles/an-introduction-to-stooq-pricing-data/
- Magic UI installation: https://magicui.design/docs/installation
- Magic UI components: https://magicui.design/docs/components
- Magic Card docs and registry source: https://magicui.design/docs/components/magic-card and https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/magic-card.tsx
- npm package checks: https://www.npmjs.com/package/csv-parse, https://www.npmjs.com/package/motion, https://www.npmjs.com/package/lucide-react, https://www.npmjs.com/package/clsx, https://www.npmjs.com/package/tailwind-merge
