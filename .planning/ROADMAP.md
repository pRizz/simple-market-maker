# Roadmap: Simple Market Maker

## Overview

This milestone makes real market data the normal path for ladder backtesting. The work starts with single-admin settings and provider secrets, then gives every market-data chunk durable provenance, adds a safe fetch/preflight lifecycle for backtests, validates Twelve Data as the second provider path, supports CSV imports as custom data, fixes and expands metrics, and finishes with source-labeled chart and interface polish. Live broker integrations and real order placement remain v2/out of scope.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Provider Settings and Secrets** - Admin can configure market-data defaults and provider keys safely.
- [ ] **Phase 2: Market Data Provenance and Source Identity** - Market-data chunks expose durable source, coverage, adjustment, currency, and quality context.
- [ ] **Phase 3: Real-Data Fetch Lifecycle and Backtest Preflight** - Backtests resolve real/custom data first, plan missing fetches, and persist source snapshots.
- [ ] **Phase 4: Twelve Data Provider Decision and Adapter** - Twelve Data becomes a validated second provider or is explicitly deferred with rationale.
- [ ] **Phase 5: CSV Import Custom Data Path** - Admin can import validated daily OHLCV CSV data as custom market-data chunks.
- [ ] **Phase 6: Metrics Correctness and Volatility** - Backtest metrics are corrected and volatility metrics are displayed with versioned assumptions.
- [ ] **Phase 7: Provider-Labeled Charts and Interface Polish** - Charts, detail pages, and operational states become source-labeled, responsive, and refined.

## Phase Details

### Phase 1: Provider Settings and Secrets

**Goal**: Admin can safely configure market-data providers, default fetch behavior, and sample-data gates before real-data workflows rely on them.
**Depends on**: Nothing (first phase)
**Requirements**: SET-01, SET-02, SET-03, SET-04, KEY-01, KEY-02, KEY-03, KEY-04, KEY-05
**Success Criteria** (what must be TRUE):

1. Admin can open a settings page from navigation and set the default provider, missing-data behavior, and sample/demo visibility.
2. Admin can create, view, update, and delete provider API keys while the browser only receives safe metadata, masked suffixes, enabled status, validation status, and timestamps.
3. Admin can validate a saved provider key and see a safe success or failure result with no raw secret or provider URL exposure.
4. Provider-backed fetches can use saved provider keys and still fall back to existing environment configuration during migration.

**Plans**: 5 plans
**UI hint**: yes

Plans:

- [x] 01-01-PLAN.md — Settings contracts, database schema, and generated migration.
- [ ] 01-02-PLAN.md — Server-only encrypted provider key storage and CRUD services.
- [ ] 01-03-PLAN.md — Provider key validation, credential resolution, and settings API routes.
- [ ] 01-04-PLAN.md — Market-data provider credential wiring and sample source gate.
- [ ] 01-05-PLAN.md — Settings UI, navigation, docs, and final verification.

### Phase 2: Market Data Provenance and Source Identity

**Goal**: User can identify and inspect exactly where each market-data chunk came from before it is used.
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):

1. User can see each chunk's source, provider/import method, requested range, actual candle coverage, interval, adjustment mode, currency, timestamp, and source metadata summary.
2. User can see repeated same-ticker/range fetches as distinct rows instead of overwritten or collapsed data.
3. User can filter or scan market-data list views by ticker, source/provider, adjustment mode, and fetch/import status.
4. User sees data-quality warnings for partial ranges, no-data responses, suspicious gaps, malformed rows, and provider/import warnings where available.
5. User sees sample data labeled as an explicit demo/development source rather than an invisible normal-data fallback.

**Plans**: TBD
**UI hint**: yes

### Phase 3: Real-Data Fetch Lifecycle and Backtest Preflight

**Goal**: User can start a backtest against real/custom data, review missing-data plans, fetch safely when needed, and receive a reproducible run.
**Depends on**: Phase 2
**Requirements**: PROV-01, PROV-03, PROV-04, PROV-05, PROV-06, BT-01, BT-02, BT-03, BT-04, BT-05, BT-06, BT-07
**Success Criteria** (what must be TRUE):

1. Starting a backtest checks persisted real/custom coverage for the required ticker, date range, interval, and adjustment mode.
2. When data is missing, user gets confirm-before-fetch details by default, or visible silent-fetch progress when that setting is enabled.
3. User sees provider fetch results as daily chunks with consistent candle fields, sanitized source metadata, and safe error categories for quota, missing key, premium endpoint, invalid symbol, no data, and malformed response failures.
4. Normal backtest flow never uses sample data unless admin explicitly chooses the demo/sample path.
5. Completed run pages and persisted run records identify the exact market-data chunk/source snapshot, provider/import method, interval, adjustment mode, currency, and fetched/imported timestamp used.

**Plans**: TBD
**UI hint**: yes

### Phase 4: Twelve Data Provider Decision and Adapter

**Goal**: Admin can use Twelve Data as a validated second provider, or see a documented deferral if the Basic-plan spike fails.
**Depends on**: Phase 3
**Requirements**: PROV-02
**Success Criteria** (what must be TRUE):

1. Admin can see Twelve Data as a selectable provider after validation, or the provider decision is documented as deferred with the reason.
2. If implemented, admin can save and validate a Twelve Data key and use Twelve Data in the same manual fetch and missing-data backtest flows as Alpha Vantage.
3. If implemented, Twelve Data chunks show provider metadata including daily interval, adjustment mode, currency, exchange/timezone where available, and source warnings through existing provenance surfaces.
4. If implemented, Twelve Data quota, missing-key, no-data, invalid-symbol, premium, and malformed responses use the shared safe error lifecycle.

**Plans**: TBD
**UI hint**: yes

### Phase 5: CSV Import Custom Data Path

**Goal**: Admin can bring custom daily OHLCV CSV data into the same source/provenance/backtest path as provider chunks.
**Depends on**: Phase 4
**Requirements**: CSV-01, CSV-02, CSV-03, CSV-04, CSV-05
**Success Criteria** (what must be TRUE):

1. Admin can import a CSV through a documented daily OHLCV contract with declared ticker, interval, adjustment, and currency assumptions.
2. Admin sees a validation report with parsed rows, rejected rows, warnings, inferred coverage, and final source metadata.
3. Ambiguous or malformed CSV files are rejected with clear reasons rather than guessed silently.
4. Successful imports persist as custom market-data chunks and can satisfy the same backtest data-resolution flow as provider chunks.

**Plans**: TBD
**UI hint**: yes

### Phase 6: Metrics Correctness and Volatility

**Goal**: User can trust corrected backtest metrics and interpret volatility with documented, versioned assumptions.
**Depends on**: Phase 5
**Requirements**: MET-01, MET-02, MET-03
**Success Criteria** (what must be TRUE):

1. Run summaries no longer show the known false win-rate or exposure calculations.
2. User can see volatility metrics in market-data and backtest detail views with documented calculation assumptions.
3. Persisted run metrics include method/version metadata for corrected performance and volatility calculations.
4. Sparse series, constant prices, and data gaps produce controlled metric output or warnings instead of precise-looking invalid values.

**Plans**: TBD
**UI hint**: yes

### Phase 7: Provider-Labeled Charts and Interface Polish

**Goal**: User can scan source-labeled charts, operational states, and polished detail pages without losing data density or provenance.
**Depends on**: Phase 6
**Requirements**: CHART-01, CHART-02, CHART-03, CHART-04, UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):

1. Market-data charts label provider/import source, adjustment mode, currency, interval, and fetch/import timestamp.
2. Backtest run charts label the exact market-data source snapshot and expose data-quality context in tooltips or nearby chart chrome.
3. Detail pages remain responsive and readable as candle, fill, and imported dataset sizes grow beyond demo examples.
4. Fetch, import, validation, missing-key, missing-data, no-data, loading, and empty states are clear and actionable.
5. Magic UI components and icons refine cards, tables, status/progress surfaces, and metric displays without marketing-style visuals or reduced data density.

**Plans**: TBD
**UI hint**: yes

## Coverage Validation

| Phase                                               | Requirement Count |
| --------------------------------------------------- | ----------------- |
| 1. Provider Settings and Secrets                    | 9                 |
| 2. Market Data Provenance and Source Identity       | 6                 |
| 3. Real-Data Fetch Lifecycle and Backtest Preflight | 12                |
| 4. Twelve Data Provider Decision and Adapter        | 1                 |
| 5. CSV Import Custom Data Path                      | 5                 |
| 6. Metrics Correctness and Volatility               | 3                 |
| 7. Provider-Labeled Charts and Interface Polish     | 9                 |

- v1 requirements mapped: 45/45
- Orphaned requirements: 0
- Duplicate phase assignments: 0

## Known Planning Risks

- Twelve Data needs a focused Basic-plan spike before full commitment; if target ticker/date behavior is poor, Phase 4 should document deferral rather than force a weak provider.
- Provider-key encryption details, redaction, and public-deployment boundaries must stay explicit in Phase 1 because the app remains single-admin/no-auth for v1.
- Phase 3 has the highest behavior risk: quota handling, dedupe, typed fetch status, and safe failure recovery must be settled before silent fetch is useful.
- Metric formulas and minimum-sample behavior must be locked before Phase 6 displays new volatility values.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase                                               | Plans Complete | Status      | Completed |
| --------------------------------------------------- | -------------- | ----------- | --------- |
| 1. Provider Settings and Secrets                    | 0/5            | Not started | -         |
| 2. Market Data Provenance and Source Identity       | 0/TBD          | Not started | -         |
| 3. Real-Data Fetch Lifecycle and Backtest Preflight | 0/TBD          | Not started | -         |
| 4. Twelve Data Provider Decision and Adapter        | 0/TBD          | Not started | -         |
| 5. CSV Import Custom Data Path                      | 0/TBD          | Not started | -         |
| 6. Metrics Correctness and Volatility               | 0/TBD          | Not started | -         |
| 7. Provider-Labeled Charts and Interface Polish     | 0/TBD          | Not started | -         |
