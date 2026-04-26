# Project Research Summary

**Project:** Simple Market Maker
**Domain:** Single-admin stock ladder strategy backtesting workstation
**Researched:** 2026-04-26
**Confidence:** MEDIUM-HIGH

## Executive Summary

Simple Market Maker is a brownfield trading research workstation, not a live trading platform. Experts build this kind of product around trustworthy data lineage: source-aware market-data ingestion, explicit adjusted/raw/currency assumptions, reproducible backtest inputs, pure metric calculations, and operational UI states that explain what data was fetched, imported, reused, or missing.

The recommended approach is to keep the existing Bun, Next.js App Router, TypeScript, PostgreSQL, Drizzle, Tailwind, and ECharts stack while making real market data the default product path. Add a provider/settings/API-key foundation first, keep Alpha Vantage, implement Twelve Data as the best researched second provider candidate after a small API-key validation spike, and support CSV import as the custom-data path. Sample data should remain available only as an explicit demo/development source.

The main risks are not technical novelty; they are trust failures. The roadmap should avoid silent quota-consuming fetches, untracked provider differences, mixed adjusted/raw candles, leaked API keys, invalid CSV imports, and attractive charts that hide data provenance. Mitigate those risks by building settings and secrets, durable provenance, fetch lifecycle, and run-level source snapshots before metrics and visual polish.

## Key Findings

### Recommended Stack

Keep the current stack and extend it through existing functional-core/server-shell boundaries. Do not replace the ORM, charting library, app framework, or package manager during this milestone. Do not add auth, queues, vendor SDKs, a second charting library, object storage, or a generalized market-data warehouse for v1.

The only recommended additions are targeted: Twelve Data as a second provider adapter, `csv-parse` for server-side CSV import, and a small Magic UI support surface through copied components plus `motion`, `lucide-react`, `clsx`, and `tailwind-merge` only where they clarify operational states.

**Core technologies:**

- Bun 1.3.13: runtime and package manager - already pinned and used by the app and Docker path.
- Next.js 16.2.4 App Router and React 19.2: delivery layer - current pages and API routes already match this model.
- TypeScript 5.9.3 and Zod 4.1.12: typed boundaries - extend existing validation for settings, provider metadata, keys, CSV rows, and run artifacts.
- PostgreSQL and Drizzle ORM 0.44.7: persistence - existing backtests, chunks, and runs are already repository-backed.
- Tailwind CSS 4.1.16: styling - existing UI is Tailwind-first and compatible with selective Magic UI component copies.
- ECharts 6.0.0 with `echarts-for-react` 3.0.2: charts - already covers candles, volume, equity, and drawdown; add source labels instead of replacing it.
- Native `fetch`: provider HTTP - simple REST adapters are clearer than vendor SDKs for Alpha Vantage and Twelve Data.
- `csv-parse` 6.2.1: CSV import - avoids brittle string splitting and handles real CSV edge cases.

### Expected Features

The feature research is clear: make the app trustworthy before making it broad. The table-stakes cluster is provider credentials and settings, richer market-data identity, real-data-first run preflight, visible fetch lifecycle, CSV import, volatility metrics, and source labels on market-data and run charts.

**Must have (table stakes):**

- Provider/settings/API-key CRUD - real data cannot remain controlled by `.env` alone.
- Provider identity and chunk provenance - persist provider/import source, requested and actual ranges, interval, adjustment mode, currency, metadata, and fetch/import timestamp.
- Separate rows for distinct fetches - do not collapse repeated or provider-different chunks.
- Real-data-first backtest preflight - missing data should return a fetch plan before the run consumes quota or creates chunks.
- Confirm-before-fetch default - users should see provider, ticker, date range, interval, adjusted status, and quota context.
- Optional silent fetch setting - allowed only with visible progress and the same source details.
- Run-level data provenance - every persisted run should record the exact chunk/source snapshot used.
- CSV import - support a narrow OHLCV contract for custom data without creating a separate backtest path.
- Data quality checks - show coverage, first/last candle, gaps, no-data responses, and provider warnings.
- Volatility metrics - add pure, versioned calculations to contextualize ladder results.
- Chart/source labels - charts must show provider/import, adjusted state, currency, and fetch/import time.

**Should have (competitive):**

- Minimal data provenance timeline - requested, fetched/imported, used in run, failed/retried where available.
- Smart missing-range fetch planner - start simple with contiguous missing windows and provider/range notes.
- Provider comparison badge - useful after Twelve Data lands and chunks can be compared.
- Import validation report - parsed rows, rejected rows, warnings, declared adjustment/currency.
- Provider quota/usage hints - human-readable warnings for Alpha Vantage and Twelve Data limits.
- Rolling volatility overlay - useful if chart work is already touched by volatility metrics.
- Refined operational states - subtle Magic UI for loading, empty, status, and metric surfaces.

**Defer (v2+):**

- Live broker trading and real order placement - requires a separate risk, broker, auth, and compliance milestone.
- Multi-user accounts, teams, roles, and public SaaS hardening - v1 remains single-admin.
- Intraday and multi-interval expansion - daily data is the current model and should stay the only implemented interval.
- Full candle table or warehouse rewrite - add metadata and projections now; normalize candles later if volume forces it.
- Generic CSV/Excel mapping wizard - support one clear OHLCV import contract first.
- Strategy optimizer, parameter sweeps, ML signals, and broad indicator marketplace - data trust comes first.
- Complex multi-currency conversion - persist/display currency assumptions and restrict or warn on non-USD for now.

### Architecture Approach

Extend the existing functional-core/server-shell architecture. The major architectural change is moving backtest candle acquisition out of the `MARKET_DATA_SOURCE` environment switch and into a server-side `MarketDataResolutionService`. The pure ladder engine should keep accepting `Candle[]`; provider, chunk, import, and provenance details belong around the engine at service/repository boundaries.

**Major components:**

1. Provider registry - central descriptor list for supported providers, labels, capabilities, intervals, adjustment modes, key requirements, and adapter factories.
1. Provider adapters - fetch Alpha Vantage, Twelve Data, and sample data; normalize provider payloads to candles plus sanitized metadata.
1. Market data domain - source-neutral types for provider ids, intervals, adjustment modes, currency, chunk metadata, coverage windows, CSV parse results, and volatility metrics.
1. Settings and secrets module - single-admin app settings, provider settings, API-key CRUD, encryption, masking, and validation status.
1. Market data fetch service - validates requests, resolves credentials/settings, calls adapters, normalizes candles, and persists chunks.
1. Market data resolution service - finds compatible chunks, computes missing windows, executes confirmed or silent fetch plans, and returns candles plus provenance.
1. CSV import service - parses uploaded files through pure domain logic and persists `custom_csv` chunks through the same repository path.
1. Backtest service - runs prepare/run orchestration, requests resolved candles, executes the pure ladder engine, calculates metrics, and persists run provenance.
1. Repositories - own Drizzle queries and typed row-to-domain parsing, especially JSONB provenance and run artifacts.
1. UI and charts - render settings, fetch progress, import reports, source labels, volatility metrics, and restrained polish.

### Critical Pitfalls

1. **Treating provider fetches like ordinary form submits** - add coverage planning, typed fetch statuses, provider-aware errors, timeouts, dedupe, quota messaging, and visible progress before silent fetch.
1. **Persisting candles without durable provenance** - make provider/import source, adjustment mode, currency, timezone, request metadata, and run chunk snapshots first-class before adding more providers or imports.
1. **Mixing adjusted and raw prices** - store and display adjustment mode everywhere; never fulfill a backtest across mismatched adjustment modes without explicit selection.
1. **Letting API-key CRUD expose secrets** - keep all key work server-only, encrypt at rest, return only masked suffixes, redact URLs/errors, and never use `NEXT_PUBLIC_*` names for secrets.
1. **Leaving sample data as an invisible fallback** - product behavior should return "needs fetch/selection" when real data is missing unless the user deliberately chooses demo/development data.
1. **Treating CSV import as a validation shortcut** - use a real parser, row validation, file/row limits, duplicate-date handling, adjustment/currency declarations, and import metadata.
1. **Adding volatility before fixing metric semantics** - fix known win-rate/exposure issues, compute metrics from returns with documented annualization, and version metric artifacts.
1. **Chart polish obscuring data lineage** - every market-data and run chart needs source labels before Magic UI polish.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Provider Settings and Secrets

**Rationale:** Missing-data fetches and second-provider work need durable defaults, key lookup, secret handling, and safe provider errors first.
**Delivers:** Settings module, app settings table, provider key table, encryption helper, masked CRUD UI/API, provider status/test action, provider registry descriptor skeleton.
**Addresses:** Provider API-key CRUD, settings page, provider availability/status messaging.
**Avoids:** Secret leakage, raw error exposure, provider choice scattered across UI/services.
**Research flag:** Standard patterns; no deeper research needed beyond implementation-time encryption details and existing Next.js server-only checks.

### Phase 2: Data Provenance Schema

**Rationale:** Every later feature depends on stable source identity. Adding Twelve Data, CSV import, or source-labeled charts before provenance risks non-reproducible runs.
**Delivers:** Market-data source fields, adjustment mode, currency, requested/actual ranges, source metadata JSON, display labels, indexes, run provenance JSON, typed repository parsers.
**Addresses:** Provider identity model, separate chunk rows, run-level data provenance, data-source labels, sample/custom gates.
**Avoids:** Same-range chunk collapse, mixed provider ambiguity, adjusted/raw mixing, invisible USD assumptions.
**Research flag:** Standard patterns; use repo-specific schema planning, but no new external research required.

### Phase 3: Fetch Lifecycle and Real-Data-First Backtest Preflight

**Rationale:** The product behavior should change only after settings and provenance exist. Confirmed fetch is the safer default and creates the contract silent fetch reuses.
**Delivers:** Coverage resolver, prepare-run API, missing-data fetch plan, confirmed fetch/run path, typed fetch statuses, quota/error mapping, progress UI, sample-data exclusion from default resolution, optional silent fetch setting.
**Addresses:** Real-data-first run path, missing-data preflight, confirm-before-fetch, optional silent fetch, visible fetch lifecycle, provider status failures.
**Avoids:** Invisible quota consumption, duplicate chunks, surprise sample fallback, generic provider errors.
**Research flag:** Needs focused implementation research for provider quota/error mapping, concurrency/dedupe strategy, and route lifecycle limits.

### Phase 4: Twelve Data Provider Adapter

**Rationale:** The second provider should land after registry, settings, provenance, and fetch lifecycle exist so provider-specific metadata has somewhere durable to go.
**Delivers:** Twelve Data adapter, request construction, response parsing, metadata persistence, adjusted/default behavior mapping, key validation, provider contract tests.
**Uses:** Native `fetch`, Zod parsing, provider registry, settings/secrets repository.
**Implements:** Provider adapter boundary and shared fetch service.
**Avoids:** Treating Alpha Vantage as enough despite 25/day free limit; adding a provider with no source model.
**Research flag:** Needs `/gsd-research-phase` or a small spike with a real Basic key to validate target symbols, date ranges, adjustment semantics, and quota headers.

### Phase 5: CSV Import Custom Data Path

**Rationale:** CSV import should reuse the now-stable chunk/provenance model rather than creating a separate data path.
**Delivers:** Strict OHLCV CSV contract, upload route, pure parser, validation report, rejected-row handling, import metadata, `custom_csv` chunks, import detail redirect.
**Addresses:** CSV import, custom-data gate, import validation report, data quality checks.
**Avoids:** Malformed custom data corrupting backtests, generic spreadsheet scope creep, Stooq scraping.
**Research flag:** Standard patterns; no deeper research needed if `csv-parse` is accepted, but planning should define file/row limits and partial-import behavior.

### Phase 6: Backtest Metrics Correctness and Volatility

**Rationale:** More metrics should not be layered on top of known metric issues. Metric correctness belongs before polished charts.
**Delivers:** Fixes for known win-rate/exposure issues, pure volatility metric functions, deterministic fixtures, method/version metadata, run volatility snapshots, market-data detail metrics.
**Addresses:** Volatility metrics, reproducible run summaries, data quality warnings.
**Avoids:** Precise-looking wrong numbers, calendar-day annualization ambiguity, sparse-series false confidence.
**Research flag:** Standard financial formulas are well documented; planning should still specify exact annualization and minimum-sample policy.

### Phase 7: Provider-Labeled Charts and Operational UI Polish

**Rationale:** Charts and Magic UI should come after provenance, metrics, and real workflow states exist, so polish clarifies rather than hides data lineage.
**Delivers:** Source badges/subtitles on market-data and run charts, chart tooltip provenance, list/detail scanability, filters/projections where needed, subtle Magic UI cards/loading/empty/status states.
**Addresses:** Data-source labels, market-data scanability, chart/detail polish, Magic UI refinement.
**Avoids:** Attractive but source-opaque charts, over-polished low-density UI, ECharts blank/clipped layouts.
**Research flag:** Mostly standard patterns; deeper UI research only if choosing unfamiliar Magic UI components or changing chart layout substantially.

### Phase Ordering Rationale

- Settings and secrets come before fetch UX because provider defaults, key availability, and safe errors are prerequisites for real-data behavior.
- Data provenance comes before provider expansion and CSV import because distinct source identity is the stable contract shared by providers, imports, backtests, and charts.
- Fetch lifecycle comes before silent fetch because silent mode is only acceptable once progress, dedupe, errors, and quota context are visible.
- Twelve Data comes after the shared provider registry and fetch lifecycle so it can be implemented as one adapter instead of a parallel workflow.
- CSV import comes after provenance so custom data flows through the same chunk and resolver path as provider data.
- Metrics come before chart polish so the UI does not make unverified financial summaries look more authoritative.
- Magic UI polish is last because it should refine real states, not define the product architecture.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3: Fetch Lifecycle and Real-Data-First Backtest Preflight** - concurrency, idempotency, quota mapping, and inline request lifecycle need a focused design pass.
- **Phase 4: Twelve Data Provider Adapter** - validate real Basic-key behavior against expected tickers, ranges, adjustment modes, and quota headers before committing to full implementation.
- **Phase 6: Backtest Metrics Correctness and Volatility** - specify exact formulas, annualization assumptions, and fixture expectations before coding.

Phases with standard patterns where `/gsd-research-phase` can usually be skipped:

- **Phase 1: Provider Settings and Secrets** - established server-only CRUD, encryption, masking, and settings patterns.
- **Phase 2: Data Provenance Schema** - standard schema/repository/domain parsing work once fields are chosen.
- **Phase 5: CSV Import Custom Data Path** - well-covered parser/import/validation workflow with `csv-parse`.
- **Phase 7: Provider-Labeled Charts and Operational UI Polish** - standard chart labels and restrained UI-component integration after data contracts exist.

## Confidence Assessment

| Area         | Confidence  | Notes                                                                                                                                                                         |
| ------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | MEDIUM-HIGH | Core stack is verified against local `package.json` and codebase maps. Twelve Data and Magic UI choices rely on official docs but should be rechecked at implementation time. |
| Features     | HIGH        | Features align directly with `.planning/PROJECT.md`, current codebase constraints, and provider/backtesting trust requirements.                                               |
| Architecture | HIGH        | Architecture recommendations fit the current functional-core/server-shell layout and local module boundaries.                                                                 |
| Pitfalls     | MEDIUM-HIGH | Most risks are grounded in current codebase concerns and official provider/security docs; exact exchange calendar and provider terms details can change.                      |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Twelve Data real-key behavior: run a small provider spike before full adapter work to confirm symbol coverage, response metadata, adjustment semantics, date bounds, and quota headers.
- Provider terms and recency: record plan, data recency, and permitted-use assumptions in provider docs/settings before any public or broker-adjacent use.
- Exchange-calendar completeness: v1 can warn on suspicious gaps without a full exchange calendar, but planning should define what counts as hard failure versus warning.
- API-key encryption policy: choose the exact `PROVIDER_KEYS_ENCRYPTION_SECRET` requirements and rotation/deletion behavior before implementing CRUD.
- Fetch idempotency and duplicate handling: decide whether v1 uses durable fetch records or service-level dedupe before enabling silent fetch.
- CSV import limits: define file size, row count, partial-import confirmation, formula-like text handling, and duplicate-date behavior.
- Metrics formulas: fix known metric issues and document volatility annualization/minimum-sample policy before adding new displays.
- List/detail performance: add projections and pagination if imported/provider chunks make list pages parse large JSON payloads.
- Auth/public deployment: single-admin/no-auth is acceptable for this milestone, but public SaaS or broker trading must revisit access control and credential isolation.

## Sources

### Primary (HIGH confidence)

- `.planning/PROJECT.md` - product scope, active requirements, constraints, and key decisions.
- `.planning/research/STACK.md` - stack decisions, provider choices, dependency recommendations, and roadmap implications.
- `.planning/research/FEATURES.md` - table-stakes features, differentiators, anti-features, and MVP order.
- `.planning/research/ARCHITECTURE.md` - component boundaries, data flows, persistence model, and build order.
- `.planning/research/PITFALLS.md` - critical and moderate risks, mitigations, phase warnings, and verification implications.
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, `README.md`, and `src/modules/db/schema.ts` as referenced by the research files - current codebase shape and risks.
- Alpha Vantage official docs/support/pricing - current daily data behavior and free limit context.
- Twelve Data official docs/support/pricing - second-provider candidate, time-series behavior, credits, metadata, and adjustment modes.
- Magic UI docs and component catalog - component installation model and polish scope.
- ECharts chart-size docs - chart sizing/responsive cautions.
- OWASP secrets and cryptographic storage guidance - provider key storage and redaction risks.
- OWASP CSV injection and RFC 4180 - CSV validation and injection risks.

### Secondary (MEDIUM confidence)

- Polygon/Massive docs, pricing, and knowledge-base pages - future paid/provider path, split adjustment, limits, and custom bars.
- Finnhub official docs/SDK landing - stock candle availability concerns and backup-provider uncertainty.
- QuantStart Stooq reference - supports treating Stooq-like data as CSV import rather than a network provider.
- Papa Parse docs - useful CSV parsing/streaming reference, though the stack recommendation is server-side `csv-parse`.
- QuantConnect and Fidelity references - backtesting bias, algorithm statistics, and historical volatility context.

### Tertiary (LOW confidence)

- Bright Builds canonical standards loaded from the pinned sidecar commit - workflow and architecture alignment context, not product-domain evidence.

---

_Research completed: 2026-04-26_
_Ready for roadmap: yes_
