# Architecture Research: Real-Data-First Backtesting

**Project:** Simple Market Maker
**Research type:** Architecture dimension
**Researched:** 2026-04-26
**Overall confidence:** HIGH for codebase integration, MEDIUM for provider-specific constraints

## Inputs Reviewed

- `.planning/PROJECT.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/CONCERNS.md`
- `src/modules/db/schema.ts`
- Current market-data/backtest domain, service, provider, repository, API, chart, and form seams.
- Repo guidance: `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`, and the local copy of Bright Builds architecture, code-shape, and TypeScript/JavaScript standards.
- Current official docs for Magic UI, Alpha Vantage, Twelve Data support/docs, and Polygon/Massive stocks REST docs.

## Recommendation

Extend the existing functional-core/server-shell architecture. Do not add a parallel data pipeline for real-data-first runs. The new milestone should make market data a first-class resolved input to a backtest run:

```text
Backtest definition
  -> market-data coverage resolution
  -> optional fetch/import to persisted market-data chunk rows
  -> selected source segments
  -> pure ladder engine
  -> run result plus market-data provenance
  -> source-labeled charts and metrics
```

The biggest architectural change is to move backtest candle acquisition out of `MARKET_DATA_SOURCE` environment selection and into a server-side `MarketDataResolutionService`. The backtest service should ask that resolver for candles and provenance. The resolver can use already persisted chunks, ask the fetch service to create missing chunks when the user confirms or settings allow silent fetches, or return a typed missing-data plan.

Keep the current `Candle[]` contract into `runLadderBacktest()` unchanged. Add provenance around candles at the service/repository boundary rather than polluting the pure simulation engine with provider concerns.

## Component Boundaries

| Component                               | Location                                                                                                   | Responsibility                                                                                                                                                                 | Communicates With                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Provider registry                       | `src/modules/market-data/server/provider-registry.ts` plus domain provider ids                             | Compile-time list of supported providers, labels, capabilities, default interval, adjusted support, key requirements, and provider factory creation.                           | Provider adapters, settings service, fetch forms, missing-data plan UI |
| Provider adapters                       | `src/modules/market-data/server/*-market-data-provider.ts`                                                 | Fetch provider-specific OHLCV, normalize to `Candle[]`, return sanitized provider metadata.                                                                                    | Registry, API key repository, fetch service                            |
| Market data domain                      | `src/modules/market-data/domain/`                                                                          | Source-neutral types: provider id, interval, adjustment mode, currency, chunk metadata, coverage windows, source segments, CSV parse results, volatility metrics over candles. | Services, repositories, forms, charts, tests                           |
| Market data fetch service               | `src/modules/market-data/server/market-data-service.ts` or a new `market-data-fetch-service.ts`            | Validate fetch requests, resolve provider credentials/settings, call provider adapter, normalize/sort/filter candles, persist chunks with source metadata.                     | Provider registry, API key repo, settings repo, chunk repo             |
| Market data coverage/resolution service | `src/modules/market-data/server/market-data-resolution-service.ts`                                         | Given ticker/date/interval/adjustment/provider preference, find compatible chunks, compute missing windows, optionally execute fetch plan, and return candles plus provenance. | Chunk repo, fetch service, settings service, backtest service          |
| CSV import service                      | `src/modules/market-data/server/csv-import-service.ts`                                                     | Parse uploaded CSV through pure domain parser, normalize candles, persist as `custom_csv` market-data chunk with import metadata.                                              | App Router upload API, chunk repo, market-data domain parser           |
| Settings domain/server                  | `src/modules/settings/domain/`, `src/modules/settings/server/`                                             | Typed single-admin settings and provider API key management. Avoid account/team abstractions.                                                                                  | Settings pages/API, provider registry, fetch/resolution services       |
| Backtest service                        | `src/modules/backtests/server/backtest-service.ts`                                                         | Continue CRUD/run orchestration, but replace direct `MarketDataProvider` dependency with `MarketDataResolutionService`. Persist run source provenance.                         | Backtest repos, market-data resolver, pure engine                      |
| Repositories                            | `src/modules/*/server/*repository.ts`                                                                      | Own Drizzle queries and row-to-domain mapping, including Zod/domain parsing of JSONB provenance/artifacts.                                                                     | Services only                                                          |
| Delivery routes                         | `src/app/api/...`, `src/app/.../page.tsx`                                                                  | Route-level parsing, response mapping, redirects, and UI data loading. Keep business rules out.                                                                                | Services                                                               |
| Chart/UI components                     | `src/components/charts/`, `src/components/market-data/`, `src/components/backtests/`, `src/components/ui/` | Render source labels, fetch progress, settings forms, import forms, volatility metrics, and subtle Magic UI wrappers.                                                          | Domain records and API routes only                                     |

## Provider Registry Shape

Use a typed registry instead of scattered `if source === ...` checks.

```typescript
type MarketDataProviderDescriptor = {
  id: MarketDataProviderId;
  label: string;
  requiresApiKey: boolean;
  supportedIntervals: MarketDataInterval[];
  supportedAdjustmentModes: MarketDataAdjustmentMode[];
  defaultAdjustmentMode: MarketDataAdjustmentMode;
  defaultCurrency: "USD";
  createProvider: (deps: ProviderRuntimeDeps) => MarketDataFetchProvider;
};
```

Start with `sample`, `alpha_vantage`, one researched second provider if selected, and `custom_csv`. Keep `custom_csv` as an import source, not a network provider. Registry descriptors should drive forms, settings labels, missing-data prompts, and provider factory wiring.

The existing `MarketDataFetchProvider` should return more than raw candles:

```typescript
type FetchMarketDataResult = {
  candles: Candle[];
  metadata: MarketDataSourceMetadata;
};
```

This lets the app store provider request id, returned adjusted status, response timezone, symbol metadata, data recency, and any provider-specific warnings without making charts or backtests know provider payload shapes.

## Persistence Model Changes

### Provider and Settings Tables

Add a settings module and keep it single-admin.

| Table               | Key fields                                                                                                                         | Notes                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `app_settings`      | singleton `id`, `defaultMarketDataProvider`, `defaultMissingDataBehavior`, `defaultAdjustmentMode`, `defaultInterval`, `updatedAt` | Prefer a typed singleton row over generic key/value so settings have clear types.         |
| `provider_api_keys` | `id`, `providerId`, `apiKeyCiphertext`, `apiKeyLast4`, `createdAt`, `updatedAt`, `lastValidatedAt`                                 | Store only encrypted secret material server-side. No client route should return raw keys. |
| `provider_settings` | `providerId`, `enabled`, `displayPriority`, `defaultAdjustmentMode`, `updatedAt`                                                   | Optional but useful once provider registry supports more than Alpha Vantage.              |

Use `server-only` credential helpers. For v1, an app-level encryption secret is enough; do not build users, teams, ownership, or OAuth. If encryption is deferred, explicitly record that as a risk and never expose the raw value back through JSON.

### Market Data Chunks

Extend `market_data_chunks` instead of replacing it.

Recommended columns:

| Column                                       | Purpose                                                                                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider_id` or expanded `source` enum      | Distinguish `sample`, `alpha_vantage`, selected second provider, and `custom_csv`.                                                                   |
| `adjustment_mode`                            | `unadjusted`, `adjusted`, or `unknown`; clearer than a nullable boolean for custom imports.                                                          |
| `currency`                                   | Default `USD` for this milestone.                                                                                                                    |
| `requested_start_date`, `requested_end_date` | Preserve the user/provider request range.                                                                                                            |
| existing `start_date`, `end_date`            | Treat as actual persisted candle coverage after provider filtering/import parsing.                                                                   |
| `source_metadata_json`                       | Sanitized provider/import metadata: request path without key, response status, provider symbol, timezone, import filename/hash/column map, warnings. |
| `source_label`                               | Cached display label such as `Alpha Vantage, daily, unadjusted, USD`.                                                                                |

Do not add a uniqueness constraint that collapses repeat fetches. A requirement is to distinguish separate fetches by provider, ticker, date range, interval, adjusted status, fetch timestamp, and metadata. Add indexes for lookup, not uniqueness:

```text
(ticker, interval, adjustment_mode, currency, provider_id, start_date, end_date)
(ticker, fetched_at)
```

JSONB candle storage is acceptable for this milestone because the repo already uses chunk-level JSON. Keep the repository responsible for parsing. Flag a future migration to per-candle rows if large ranges or many imports become slow.

### Backtest Runs

Persist data provenance with every completed run so charts and future audits can explain which market data was used.

Recommended low-churn approach:

| Column                        | Purpose                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `market_data_provenance_json` | Versioned JSON containing ordered source segments, chunk ids, provider ids, labels, adjustment mode, currency, fetched/imported timestamps, and coverage dates. |
| `volatility_metrics_json`     | Versioned volatility metrics derived from the run candle series.                                                                                                |
| optional scalar columns       | `marketDataProviderId`, `marketDataAdjustmentMode`, `marketDataCurrency`, `annualizedVolatilityPercent` for list views if needed.                               |

If the roadmap chooses multi-chunk stitching in the same milestone, prefer a child table:

```text
backtest_run_market_data_segments
  run_id -> backtest_runs.id
  chunk_id -> market_data_chunks.id
  start_date
  end_date
  source_label
```

Otherwise, begin with one covering chunk per run and store provenance JSON. The resolver can later expand to multiple segments without changing the pure engine.

## Data Flow: Missing-Data Fetch Discovery

```text
Backtest detail page run button
  -> POST /api/backtests/{id}/run/prepare
  -> BacktestService.prepareRun(definitionId)
  -> BacktestRepository.getBacktestById()
  -> SettingsService.getSettings()
  -> MarketDataResolutionService.planCoverage({
       ticker,
       startDate,
       endDate,
       interval: "daily",
       providerPreference,
       adjustmentMode,
       currency: "USD",
     })
  -> MarketDataChunkRepository.findCoverage()
  -> response:
       ready: selected source segments
       or missing: fetch plan with provider, date windows, adjustment, estimated quota cost, warnings
```

The prepare endpoint should not create a run row and should not call external providers. It only reads persisted data and returns a typed plan.

For MVP, avoid mixing providers silently. A coverage plan may stitch adjacent chunks only when provider, interval, adjustment mode, and currency match. If the only available data mixes sources, return a plan requiring explicit user confirmation.

## Data Flow: Confirmed Fetch

```text
User confirms "Fetch this data?"
  -> POST /api/backtests/{id}/run
       { mode: "fetch_confirmed", providerId, adjustmentMode, interval }
  -> BacktestService.runBacktest()
  -> MarketDataResolutionService.resolveForRun()
  -> existing coverage check
  -> MarketDataFetchService.executeFetchPlan()
  -> ProviderRegistry.descriptor(providerId)
  -> ProviderApiKeyRepository.maybeGetKey(providerId)
  -> provider.fetchCandles()
  -> normalize/sort/filter candles in market-data domain helpers
  -> MarketDataChunkRepository.createChunk()
  -> MarketDataResolutionService returns candles + provenance
  -> runLadderBacktest(definition, candles)
  -> BacktestRunRepository.completeRun(result + provenance + volatility)
  -> UI navigates to run detail
```

Confirmed fetch and manual market-data fetch should call the same fetch service. The only difference is the caller and the redirect target.

## Data Flow: Silent Fetch

```text
Run button
  -> POST /api/backtests/{id}/run
  -> SettingsService.getSettings()
  -> if missing data and defaultMissingDataBehavior === "silent_fetch"
       MarketDataResolutionService.executeFetchPlan()
     else
       return missing-data result for confirmation UI
  -> run with persisted fetched chunk
```

Silent fetch must still surface visible client state. The current synchronous request model can support a disabled button plus spinner/toast for short daily fetches. Do not introduce a full queue unless range size, provider latency, or deployment timeouts force it. The architecture should still return typed statuses (`fetching`, `running`, `failed`, `completed`) so a future job queue can replace the internals without rewriting the UI.

## Data Flow: CSV Import

```text
Market data import page
  -> multipart POST /api/market-data/import
  -> CsvImportService.importCsv()
  -> pure parseMarketDataCsv(file text, declared options)
  -> normalize ticker, interval, adjustment mode, currency, date column, OHLCV columns
  -> validate candles and date ordering
  -> MarketDataChunkRepository.createChunk({
       source: "custom_csv",
       sourceMetadataJson: {
         originalFilename,
         contentHash,
         columnMap,
         rowCount,
         importedAt,
       },
     })
  -> redirect to market-data chunk detail
```

CSV parsing should live in the market-data domain as a pure parser with unit tests. File upload, size limits, and multipart handling belong in the App Router/API shell. Imported data should use the same `market_data_chunks` table so backtests and charts do not need a custom path.

## Data Flow: Backtest Run

```text
POST /api/backtests/{id}/run
  -> BacktestService.runBacktest()
  -> BacktestRepository.getBacktestById()
  -> BacktestRunRepository.createRunningRun()
  -> MarketDataResolutionService.resolveForRun()
  -> runLadderBacktest(definition, candles)
  -> calculate volatility metrics from the same candle series
  -> BacktestRunRepository.completeRun({
       result,
       marketDataProvenance,
       volatilityMetrics,
     })
  -> run detail page reads typed artifacts and renders charts/metrics/source labels
```

The pure engine should not know whether candles came from Alpha Vantage, Polygon/Massive, Twelve Data, sample data, or CSV. Source labels should be page/chart props derived from run provenance.

## Volatility Metrics

Add volatility calculations as pure domain functions, not chart code.

Recommended first metrics:

| Metric                          | Input                                                           | Persist/display                               |
| ------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| Daily close-to-close volatility | `Candle[]` close returns                                        | Market-data detail and run detail             |
| Annualized volatility           | Daily return standard deviation times trading-day annualization | Run summary and market-data detail            |
| Average true range percent      | OHLC candles                                                    | Market-data detail; useful for ladder context |
| Max single-day move             | Close-to-close returns                                          | Run detail and chart side stats               |

Place source-neutral functions in `src/modules/market-data/domain/volatility-metrics.ts`. Backtest run completion can call these functions on the exact candle series used by the run, then persist a versioned `volatilityMetricsJson` snapshot. Market-data detail can compute metrics on demand from a chunk until list views need scalar columns.

## Chart and UI Integration

Source labels should be explicit but not invasive:

```text
MarketDataChunkRecord
  -> source label, adjustment, currency, fetched/imported timestamp
  -> MarketDataCharts props
  -> chart subtitle, legend/badge, tooltip footer
```

Backtest charts should receive:

```typescript
type ChartSourceSegment = {
  sourceLabel: string;
  providerId: MarketDataProviderId;
  startDate: string;
  endDate: string;
  chunkId: string;
};
```

For one source, show a compact source badge near the chart heading. For multiple segments, show a small source timeline or legend below the chart. Avoid per-point label clutter unless a chart actually mixes sources.

Magic UI should be added as copied components under `src/components/ui/`, matching its shadcn-style install model. Use it selectively for cards, empty states, loading/fetch states, and settings/import panels. Do not wrap charts in nested decorative cards, and do not turn the app into a marketing page.

## Provider Notes

| Provider        | Architectural implication                                                                                                                                                                                                                                                                    | Confidence                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Alpha Vantage   | Existing adapter should move from env-only API key to provider registry plus persisted key lookup. Current implementation uses raw `TIME_SERIES_DAILY`; adjusted data requires an explicit adjusted mode choice. Compact/free behavior means fetch plans should explain recent-range limits. | HIGH from current code and official docs |
| Twelve Data     | `time_series` supports daily interval, date-bounded requests, JSON/CSV output, and a 5,000 point single-request recommendation. It fits the same adapter interface but needs provider-specific metadata for exchange timezone and response status.                                           | MEDIUM from official docs/support        |
| Polygon/Massive | Custom bars endpoint maps well to requested ticker/date range/adjusted status and includes pagination via `next_url`; plan history varies by subscription. It fits the registry but needs pagination and plan-limit handling.                                                                | MEDIUM from official docs                |
| CSV/custom      | Should not be a provider adapter. Treat it as `custom_csv` source persisted through the same chunk table and resolver.                                                                                                                                                                       | HIGH from architecture constraints       |

## Build Order Recommendation

1. **Source and persistence foundation**
   - Add provider ids, adjustment mode, currency, source metadata domain types.
   - Migrate market-data chunks and backtest run provenance fields.
   - Add typed parsers for new JSONB fields at repository boundaries.
   - Rationale: every later feature depends on stable source identity and provenance.

2. **Provider registry, settings, and API keys**
   - Add registry descriptors, settings service/repository, provider key repository, and settings pages/API.
   - Move Alpha Vantage API key lookup behind credential service.
   - Rationale: missing-data flows need defaults and provider credentials before they can behave predictably.

3. **Market-data fetch orchestration**
   - Refactor existing `createChunk()` to use the registry and return persisted source metadata.
   - Add the selected second provider adapter after registry shape is stable.
   - Keep manual market-data fetch working before touching backtest runs.
   - Rationale: provider correctness is easier to verify outside the backtest path first.

4. **Coverage resolver and real-data-first backtest run**
   - Add prepare/run data plan APIs.
   - Replace backtest `MarketDataProvider` env switch with `MarketDataResolutionService`.
   - Implement confirmed missing-data fetch first, then silent fetch behind the settings knob.
   - Rationale: confirmed fetch is the safer default and provides the UX contract silent fetch reuses.

5. **CSV import**
   - Add pure CSV parser and upload/import route.
   - Persist imported chunks as `custom_csv` with declared adjustment/currency metadata.
   - Rationale: import benefits from the same chunk/provenance model and should not force a separate backtest path.

6. **Volatility metrics and source-labeled chart polish**
   - Add pure volatility metrics.
   - Persist run volatility snapshots.
   - Update market-data and run charts with source labels and metric panels.
   - Rationale: metrics and chart labels are most accurate after provenance is durable.

7. **Magic UI polish pass**
   - Install/copy only the needed Magic UI components.
   - Apply to loading, empty, settings, import, and summary surfaces.
   - Rationale: polish should follow the data-flow work to avoid restyling components that are about to change.

## Risks and Mitigations

| Risk                                                  | Why it matters                                                                    | Mitigation                                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Provider selection remains environment-driven         | Prevents single-admin settings and makes silent/confirmed fetch behavior brittle. | Replace `MARKET_DATA_SOURCE` for product behavior; keep env only for build/runtime infrastructure.                       |
| Repeated fetches overwrite or hide prior data         | Requirement needs distinct persisted rows and source transparency.                | No uniqueness constraint over chunk identity; show fetched/imported timestamp and metadata.                              |
| Mixed-provider candle stitching becomes misleading    | A backtest can look deterministic while using inconsistent sources.               | Only auto-stitch compatible chunks; require explicit confirmation for mixed sources.                                     |
| API keys leak through UI or logs                      | Provider keys are sensitive even in single-admin mode.                            | Server-only credential service, encrypted storage, last-four display only, sanitized provider metadata.                  |
| JSONB provenance becomes another unvalidated artifact | Existing concerns already call out unvalidated run artifacts.                     | Add versioned schemas and parse at repository boundaries before pages render.                                            |
| Long fetch/run work exceeds request lifecycle         | Current app is synchronous.                                                       | Start synchronous with visible state and range limits; keep typed lifecycle statuses so a queue can be introduced later. |
| Magic UI creates visual drift                         | App should remain data-forward.                                                   | Use copied components as local UI primitives and apply only where interaction states improve.                            |

## Sources

- Magic UI installation: https://magicui.design/docs/installation
- Magic UI Magic Card: https://magicui.design/docs/components/magic-card
- Alpha Vantage API documentation: https://www.alphavantage.co/documentation/
- Twelve Data API documentation: https://twelvedata.com/docs
- Twelve Data historical data support: https://support.twelvedata.com/en/articles/5214728-getting-historical-data
- Twelve Data batch request support: https://support.twelvedata.com/en/articles/5203360-batch-api-requests
- Polygon/Massive REST quickstart: https://polygon.io/docs/rest/quickstart
- Polygon/Massive stocks custom bars: https://polygon.io/docs/rest/stocks/aggregates/custom-bars
- Local codebase architecture map: `.planning/codebase/ARCHITECTURE.md`
- Local schema: `src/modules/db/schema.ts`
