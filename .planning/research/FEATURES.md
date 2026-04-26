# Feature Landscape: Real-Data-First Backtesting

**Project:** Simple Market Maker  
**Domain:** Single-admin ladder strategy backtesting workstation  
**Research focus:** Features for the real-data-first backtesting milestone  
**Researched:** 2026-04-26  
**Overall confidence:** HIGH for project needs and v1 feature boundaries; MEDIUM for final second-provider choice until implementation-phase API trials are run.

## Executive Recommendation

Make v1 feel trustworthy before it feels broad. The milestone should turn real market data into the normal backtest path, make provider and source metadata visible everywhere, and preserve sample/custom data as deliberate alternate paths. The winning feature set is not more strategy knobs; it is confidence that the candles, metrics, charts, and persisted run history are reproducible.

The table-stakes feature cluster is: provider credentials and settings, richer market-data chunk identity, a backtest preflight that resolves missing data, visible fetch lifecycle states, CSV import for custom data, volatility metrics, and source labels on charts and run pages. These directly match the active requirements in `.planning/PROJECT.md` and the current architecture in `.planning/codebase/ARCHITECTURE.md`.

Differentiators should be included only where they support the core value: data provenance, reproducibility, provider comparison, and better scanning of results. Avoid live trading, public SaaS account work, intraday expansion, generic ETL, and flashy Magic UI effects in v1.

## Source Findings That Shape Features

| Source area          | Finding                                                                                                                                                                                             | Confidence | Feature implication                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| Project requirements | Real market data must become the normal backtest path; sample data remains explicit demo/development/custom data.                                                                                   | HIGH       | Missing-data resolution and source labels are v1 table stakes, not polish.                       |
| Current codebase     | Market data currently supports `sample` and `alpha_vantage`, daily interval only, chunks persisted as one row with candle JSON.                                                                     | HIGH       | Add metadata carefully before widening interval/provider scope.                                  |
| Alpha Vantage        | Free usage is limited to 25 requests/day; docs expose daily OHLCV, CSV output, adjusted/raw concepts, and premium gates for some time-series functions.                                             | HIGH       | Confirm-before-fetch, quota messaging, and explicit adjusted/unadjusted labels are necessary.    |
| Twelve Data          | Basic plan is free with 8 API credits/minute and 800/day; `/time_series` supports intervals, date bounds, output size, JSON/CSV, adjustment modes, and response metadata such as currency/exchange. | HIGH       | Best researched second-provider candidate if the milestone includes one.                         |
| Polygon/Massive      | Rich custom bar endpoint, split-adjusted flag, pagination, and clear historical tiers; free/basic stock access is end-of-day with 2 years of history.                                               | HIGH       | Strong future provider, but less aligned with low-friction broad historical v1 than Twelve Data. |
| Finnhub              | Stock candles exist and are easy to call from official SDK examples, but official API docs were less extractable during research.                                                                   | MEDIUM     | Do not choose as v1 second provider without a focused implementation spike.                      |
| Magic UI             | Component catalog is broad and heavily visual/effects-oriented.                                                                                                                                     | HIGH       | Use sparingly for loading/empty/status/value motion; avoid marketing-style components.           |

## Table Stakes for v1

Features users will expect from a credible real-data-first backtesting milestone. Missing these makes the product feel incomplete or untrustworthy.

| Feature                                      | Why expected                                                                                                  | Complexity | Dependencies                                                                           | Notes                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real-data-first run path                     | A backtesting app should run against real sourced candles by default once real data exists.                   | High       | Stored data provider, chunk coverage lookup, run API/UI changes, settings defaults     | Replace `MARKET_DATA_SOURCE`-style product behavior with in-product preflight and source selection.                                                                   |
| Missing-data preflight before run            | Users need to know when a backtest will consume provider quota or create new data rows.                       | High       | Coverage resolver, provider settings, confirm modal, fetch endpoint, run orchestration | Default behavior should be confirm-before-fetch with provider, ticker, date range, interval, adjusted status, and estimated new rows.                                 |
| Optional silent missing-data fetch           | Convenience is expected after trust is established.                                                           | Medium     | Settings page, visible fetch progress, same preflight logic                            | Silent means no confirmation only; it must still show spinner/toast/status and failure details.                                                                       |
| Provider identity model                      | Every candle range needs source identity beyond a loose `source` enum.                                        | Medium     | DB migration, domain types, repository mapping, list/detail UI                         | Persist provider, provider display name, provider request metadata, fetched timestamp, currency assumption, interval, adjusted status, and import/fetch method.       |
| Separate persisted rows for distinct fetches | Re-fetches and provider differences should remain comparable and auditable.                                   | Medium     | Metadata model, chunk list filters, matching semantics                                 | Do not silently overwrite chunks with the same ticker/date range; distinguish by provider, adjusted status, interval, fetch time, and metadata.                       |
| Single-admin provider API key CRUD           | Provider-backed real data cannot be productized through `.env` alone.                                         | High       | Settings route, provider settings table, secret storage/redaction, provider factory    | Store keys as sensitive single-admin settings. Do not build multi-user credential isolation in v1.                                                                    |
| Settings page                                | Missing-data behavior, default provider, key status, and sample/custom gates need a home.                     | Medium     | Settings persistence, app navigation, server-only config access                        | Keep settings focused on provider/default behavior; avoid account/team abstractions.                                                                                  |
| Provider availability/status messaging       | Users need actionable feedback for missing keys, quota limits, premium-only endpoints, and provider failures. | Medium     | Provider error taxonomy, safe user-facing errors, settings/key status                  | Alpha Vantage's 25/day free limit makes this table stakes.                                                                                                            |
| Explicit sample/demo/custom-data gate        | Sample data is useful but dangerous as an implicit default.                                                   | Low        | UI copy, source selectors, settings defaults                                           | Label sample data as demo/development and keep it out of the normal run path.                                                                                         |
| CSV import for daily OHLCV                   | Users may have legitimate data without a provider API.                                                        | Medium     | `custom_csv`/custom source identity, parser, validation report, chunk persistence      | Support a narrow, documented shape: date, open, high, low, close, volume, optional adjusted close/currency. Avoid fuzzy spreadsheet ETL.                              |
| Data-source labels on charts                 | Charts without provenance invite wrong interpretation.                                                        | Low-Medium | Metadata model, chart props, run-to-chunk association                                  | Show provider/custom/sample, adjusted status, fetch/import timestamp, and currency assumption on market-data and run charts.                                          |
| Run-level data provenance                    | Persisted backtest results must be reproducible.                                                              | High       | Link run to chunk/source snapshot, run artifact schema, repository changes             | Store the exact chunk or source snapshot used by each run, not just ticker/date.                                                                                      |
| Volatility metrics                           | Backtest quality requires context beyond return and drawdown.                                                 | Medium     | Candle-series math, run summary schema, charts/cards                                   | Add realized annualized volatility, rolling volatility where useful, ATR or high-low range, and volatility period assumptions.                                        |
| Data quality and coverage checks             | Missing candles, no-data responses, date truncation, and non-trading days affect trust.                       | Medium     | Candle validation, provider-specific response parsing, UI warnings                     | Show candle count, first/last candle, expected trading-day rough coverage, gaps/partial ranges, and provider no-data states.                                          |
| Fetch lifecycle UI                           | Network/provider work should not look like a frozen form.                                                     | Medium     | Client states, toast/modal/spinner, idempotency decisions                              | Current forms have known stuck-submitting failure risks; fix those while adding fetch progress.                                                                       |
| Market-data list/detail scanability          | More chunks will make the existing list harder to use.                                                        | Medium     | Metadata projections, filters/sort, compact cards/table                                | Add filters by ticker/provider/source/adjusted status and avoid parsing full candle JSON for list views when practical.                                               |
| Magic UI polish for operational states       | The app should feel refined without becoming a landing page.                                                  | Low-Medium | Existing Tailwind/UI primitives, selected Magic UI components                          | Use subtle value animation, loading skeletons, empty states, and status cards. Avoid decorative backgrounds, globes, meteors, confetti, and oversized hero treatment. |

## Differentiators Worth Including Only If They Support Core Value

These can make the product feel notably better, but they should not displace the table stakes.

| Feature                                           | Value proposition                                                                               | Complexity  | Dependencies                                                                | v1 recommendation                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Data provenance timeline                          | Makes each chunk/run auditable: requested, fetched/imported, used in run, errors/retries.       | Medium      | Provider metadata, run-to-chunk link, event records or metadata JSON        | Include a minimal timeline if run provenance is already being touched.                                   |
| Smart fetch planner                               | Shows exactly which missing date spans will be fetched instead of re-fetching covered ranges.   | High        | Coverage resolver, chunk overlap logic, provider range limits               | Include a simple version for missing contiguous ranges; defer multi-chunk optimization if it slows v1.   |
| Provider comparison badge                         | Lets users compare Alpha Vantage/Twelve Data/custom for the same ticker/range.                  | Medium      | Multiple providers, metadata filters, chart labels                          | Include only after second provider lands.                                                                |
| Rolling volatility overlay                        | Helps evaluate whether ladder behavior depends on volatility regimes.                           | Medium      | Volatility calculations, chart overlays, UI toggles                         | Worth adding if volatility metrics already touch chart code.                                             |
| Import validation report                          | Builds trust in CSV imports by showing parsed rows, rejected rows, gaps, and inferred metadata. | Medium      | CSV parser, validation result model                                         | Include a concise report; avoid generic column-mapping wizard in v1.                                     |
| Provider quota/usage hints                        | Reduces confusion with free-tier providers.                                                     | Medium      | Provider settings, persisted fetch attempts, provider-specific quota config | Include for Alpha Vantage and any second provider as human-readable guidance, not exact global metering. |
| Data coverage heatmap                             | Quickly reveals gaps across chunks and runs.                                                    | Medium-High | Chunk metadata, coverage summarization                                      | Defer unless list/detail pages still feel opaque after basic filters and labels.                         |
| Reproducibility snapshot export                   | Lets a user inspect or archive the exact data/config behind a run.                              | Medium      | Run provenance, JSON export route                                           | Defer unless export is needed for validation or sharing.                                                 |
| Enhanced empty/loading/error states with Magic UI | Makes the app feel more polished during provider setup and fetch failures.                      | Low         | UI primitives                                                               | Include selectively. This is a supporting differentiator, not a feature pillar.                          |

## Anti-Features for v1

Features to explicitly avoid because they dilute the real-data backtesting foundation or create premature architecture.

| Anti-feature                                                                         | Why avoid                                                                                                                                            | What to do instead                                                                                        |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Live broker trading and order placement                                              | The milestone goal is reliable real-data backtesting; execution adds regulatory, auth, risk, and broker-state complexity.                            | Preserve broker integration for the next milestone.                                                       |
| Multi-user accounts, roles, teams, and public SaaS hardening                         | The project requirement is single-admin; auth would dominate the milestone.                                                                          | Store single-admin settings and note public-deployment risk.                                              |
| Invisible automatic provider calls by default                                        | Consumes quotas and creates data rows users did not approve.                                                                                         | Confirm-before-fetch by default; allow silent fetch only when enabled and visible.                        |
| Intraday/multi-interval expansion                                                    | Daily data is the current model; intraday introduces exchange hours, partial sessions, higher volume, provider plan gates, and performance pressure. | Keep `daily` as the only implemented interval while recording interval metadata for future compatibility. |
| Full market-data warehouse or candle child-table rewrite as a prerequisite           | Valuable later, but too large for this milestone.                                                                                                    | Add metadata and list projections now; defer normalized candle storage until data volume requires it.     |
| Generic CSV/Excel wizard for arbitrary files                                         | Column inference, timezones, corporate actions, and messy files can absorb the milestone.                                                            | Support one clear OHLCV CSV contract with a validation report.                                            |
| Strategy optimizer, parameter sweeps, ML signals, or technical-indicator marketplace | These depend on trustworthy data and metrics first.                                                                                                  | Add only volatility metrics needed to interpret current ladder runs.                                      |
| Complex multi-currency/exchange modeling                                             | Project scope allows USD assumptions.                                                                                                                | Persist/display currency assumptions and defer conversion logic.                                          |
| Flashy Magic UI visual overhaul                                                      | Marketing effects undermine the practical workstation feel.                                                                                          | Use restrained operational polish for cards, empty states, loading states, and metric transitions.        |
| Exact real-time market entitlements                                                  | Real-time and delayed data have licensing/provider constraints.                                                                                      | Treat v1 as historical daily backtesting and label freshness clearly.                                     |

## Feature Dependencies

```text
Provider settings + API key CRUD
  -> provider factory from persisted settings
  -> provider status/error messaging
  -> missing-data fetch from backtest run flow

Market-data metadata model
  -> separate persisted rows for distinct fetches
  -> chunk list/detail labels and filters
  -> run-level data provenance
  -> chart source labels

Chunk coverage resolver
  -> missing-data preflight
  -> confirm-before-fetch default
  -> optional silent fetch setting
  -> smart fetch planner differentiator

Custom source identity
  -> CSV import
  -> import validation report
  -> backtests from custom data

Candle-series metric core
  -> volatility metrics
  -> persisted run summary updates
  -> run detail cards and chart overlays

Stable operational UI states
  -> fetch lifecycle UI
  -> Magic UI loading/empty/status polish
  -> safer form failure handling
```

## MVP Recommendation

Prioritize in this order:

1. Metadata foundation: provider/source identity, adjusted status, currency assumption, fetch/import timestamp, and distinct chunk rows.
2. Provider settings: single-admin API key CRUD, default provider, default missing-data behavior, and provider status.
3. Real-data run flow: coverage check, confirm-before-fetch default, visible fetch lifecycle, and run-to-data provenance.
4. CSV/custom path: narrow OHLCV import with validation report and explicit custom source labels.
5. Metrics and UI polish: volatility metrics, source labels on charts, list/detail scanability, and restrained Magic UI components.

Recommended second-provider decision: implement Twelve Data only if a small spike confirms the free/basic plan can fetch the target daily US equity ranges with acceptable adjusted/unadjusted semantics. It is the best current fit because it has a free tier with explicit credit limits, time-series date bounds, CSV/JSON output, adjustment modes, and metadata including currency/exchange. Polygon/Massive is stronger for a later paid/higher-quality provider path. Finnhub should remain a backup until its official docs/API behavior are validated in implementation.

Defer live trading, auth/multi-user, intraday data, candle-storage normalization, generic CSV mapping, and advanced strategy analytics.

## Phase Hints

| Phase topic        | Include                                                | Avoid                                                           |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------------------- |
| Data model         | Add provider/source metadata and run provenance early. | Rewriting all candle storage before the product path is proven. |
| Settings           | Add single-admin provider keys and behavior defaults.  | Accounts, teams, roles, or public SaaS credential architecture. |
| Backtest run UX    | Preflight missing data and fetch with visible status.  | Running sample data silently when real data is missing.         |
| Provider expansion | Spike Twelve Data after metadata/settings are ready.   | Wiring multiple providers before provider identity is durable.  |
| CSV import         | Use strict OHLCV shape and validation report.          | Arbitrary spreadsheet cleanup features.                         |
| Metrics            | Add volatility metrics computed from stored candles.   | Provider-dependent technical-indicator calls for core metrics.  |
| UI polish          | Use Magic UI only for subtle operational polish.       | Decorative marketing effects or wholesale restyling.            |

## Sources

- Project requirements and decisions: `.planning/PROJECT.md` (HIGH)
- Codebase architecture and concerns: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `README.md` (HIGH)
- Alpha Vantage documentation: https://www.alphavantage.co/documentation/ (HIGH)
- Alpha Vantage support and limits: https://www.alphavantage.co/support/ and https://www.alphavantage.co/premium/ (HIGH)
- Twelve Data pricing: https://twelvedata.com/pricing (HIGH)
- Twelve Data API docs and historical data guidance: https://twelvedata.com/docs and https://support.twelvedata.com/en/articles/5214728-getting-historical-data (HIGH)
- Twelve Data coverage/metadata overview: https://support.twelvedata.com/en/articles/5609168-introduction-to-twelve-data (HIGH)
- Polygon/Massive stock custom bars docs: https://massive.com/docs/rest/stocks/aggregates/custom-bars (HIGH)
- Polygon/Massive aggregate behavior knowledge base: https://polygon.io/knowledge-base/categories/aggregates (MEDIUM)
- Finnhub official SDK/docs landing: https://finnhubio.github.io/ and https://finnhub.io/docs/api (MEDIUM)
- Magic UI component catalog: https://magicui.design/docs/components (HIGH)
