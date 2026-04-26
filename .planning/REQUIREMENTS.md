# Requirements: Simple Market Maker

**Defined:** 2026-04-26
**Core Value:** A user can confidently run ladder backtests against clearly sourced real market data and understand the resulting performance from polished charts, metrics, and data provenance.

## v1 Requirements

Requirements for the real-data-first backtesting polish milestone. Each maps to one roadmap phase.

### Settings and Provider Keys

- [ ] **SET-01**: Admin can open a settings page from the app navigation.
- [ ] **SET-02**: Admin can choose a default market-data provider for new fetches and missing-data backtest flows.
- [ ] **SET-03**: Admin can choose the default missing-data behavior for backtests: confirm before fetch or silent fetch with visible progress.
- [ ] **SET-04**: Admin can enable or disable sample/demo data visibility from settings.
- [ ] **KEY-01**: Admin can create, view, update, and delete API keys for supported market-data providers.
- [ ] **KEY-02**: Saved provider API keys are stored server-side as sensitive values and are never exposed back to the browser in full.
- [ ] **KEY-03**: Provider API key lists show safe metadata such as provider, enabled status, masked suffix, validation status, and timestamps.
- [ ] **KEY-04**: Admin can validate a saved provider key and see a safe success or failure result.
- [ ] **KEY-05**: Provider-backed fetches use persisted API keys when available and may fall back to existing environment configuration during migration.

### Market Data Provenance

- [ ] **DATA-01**: Each market-data chunk persists provider or import source, ticker, requested date range, actual candle range, interval, adjustment mode, currency, fetch/import timestamp, and source metadata.
- [ ] **DATA-02**: Distinct fetches remain distinct persisted rows even when they share ticker, provider, interval, and requested date range.
- [ ] **DATA-03**: Market-data list and detail views show source, provider/import method, interval, adjustment mode, currency, fetched/imported timestamp, and candle coverage.
- [ ] **DATA-04**: Market-data list views can be filtered or scanned by ticker, provider/source, adjustment mode, and fetch/import status.
- [ ] **DATA-05**: Data quality warnings show partial ranges, no-data responses, suspicious gaps, malformed rows, and provider/import warnings where available.
- [ ] **DATA-06**: Sample data is presented as an explicit demo/development source, not as an invisible fallback for normal real-data workflows.

### Provider Fetching

- [ ] **PROV-01**: Alpha Vantage remains available as a real market-data provider through the shared provider registry.
- [ ] **PROV-02**: Twelve Data is added as the second provider candidate if an implementation spike confirms useful Basic-plan behavior for target ticker/date requests.
- [ ] **PROV-03**: Provider adapters normalize successful responses into the shared candle model and sanitized source metadata.
- [ ] **PROV-04**: Provider adapters map quota, missing-key, premium-endpoint, invalid-symbol, no-data, and malformed-response failures to safe user-facing errors.
- [ ] **PROV-05**: Provider fetches record enough request metadata to reproduce or diagnose the source of a stored chunk without exposing secrets.
- [ ] **PROV-06**: Provider support stays daily-first for v1 while preserving interval metadata for future expansion.

### Real-Data-First Backtests

- [ ] **BT-01**: Starting a backtest checks whether persisted real/custom market data covers the ticker, date range, interval, and adjustment mode required by the definition.
- [ ] **BT-02**: When required data is missing and confirm-before-fetch is enabled, the app shows a fetch confirmation with provider, ticker, date range, interval, adjustment mode, and expected new chunk details before running.
- [ ] **BT-03**: When silent fetch is enabled, the app can fetch missing data without a confirmation step but still shows visible progress and completion/failure state.
- [ ] **BT-04**: Backtests do not use sample data in normal real-data mode unless the admin explicitly chooses the demo/sample data path.
- [ ] **BT-05**: Completed backtest runs persist the exact market-data chunk/source snapshot used for the run.
- [ ] **BT-06**: Backtest run pages show the data source, provider/import method, interval, adjustment mode, currency, and fetch/import timestamp used by the run.
- [ ] **BT-07**: Missing-data and provider-fetch failures leave the backtest definition intact and show an actionable recovery path.

### CSV Import

- [ ] **CSV-01**: Admin can import a CSV file containing daily OHLCV data using a documented column contract.
- [ ] **CSV-02**: CSV import validates date, open, high, low, close, volume, ticker, interval, adjustment mode, and currency assumptions before persistence.
- [ ] **CSV-03**: CSV import shows a validation report with parsed rows, rejected rows, warnings, inferred coverage, and final source metadata.
- [ ] **CSV-04**: Successful CSV imports persist as custom market-data chunks that can be used by the same backtest data-resolution flow as provider chunks.
- [ ] **CSV-05**: CSV import rejects ambiguous or malformed files rather than guessing silently.

### Metrics and Charts

- [ ] **MET-01**: Known backtest metric issues around win-rate and exposure are corrected before adding new metric displays.
- [ ] **MET-02**: Market-data and backtest details show volatility metrics with documented calculation assumptions.
- [ ] **MET-03**: Persisted run metrics include enough method/version metadata to interpret volatility and corrected performance calculations later.
- [ ] **CHART-01**: Market-data detail charts clearly label provider/import source, adjustment mode, currency, interval, and fetch/import timestamp.
- [ ] **CHART-02**: Backtest run charts clearly label the market-data source snapshot used by the run.
- [ ] **CHART-03**: Chart tooltips or nearby chart chrome expose source and data-quality context without hiding the main data.
- [ ] **CHART-04**: Detail pages remain responsive and readable when candle counts, fill counts, or imported datasets grow beyond small demo examples.

### Interface Polish

- [ ] **UI-01**: Magic UI components are integrated selectively for refined cards, empty states, loading states, progress/status surfaces, and subtle metric motion.
- [ ] **UI-02**: Magic UI usage avoids marketing-style heroes, decorative overload, or effects that obscure data provenance.
- [ ] **UI-03**: Fetch, import, validation, missing-key, missing-data, and no-data states have clear empty/loading/error UI.
- [ ] **UI-04**: Buttons and compact controls use recognizable icons where appropriate, with accessible labels or tooltips.
- [ ] **UI-05**: Tables, cards, and chart sections remain dense enough for a trading research workstation while still looking polished.

## v2 Requirements

Deferred to future releases. Tracked but not in the current roadmap.

### Broker Integrations and Live Trading

- **BRKR-01**: Admin can connect broker or exchange integrations such as E\*TRADE, Alpaca, or Interactive Brokers.
- **BRKR-02**: Admin can configure live ladder order placement similarly to backtest definitions.
- **BRKR-03**: App can submit real buy and sell limit orders through supported broker APIs.
- **BRKR-04**: App tracks real order status, fills, fees, realized/unrealized P/L, and execution costs.
- **BRKR-05**: Charts can overlay real buy and sell orders on market data.
- **BRKR-06**: Dashboard shows real account and strategy statistics from live orders and positions.

### Future Data and Analytics

- **DATA2-01**: App can support paid/professional providers such as Polygon/Massive when stronger data quality or history justifies the dependency.
- **DATA2-02**: App can support intraday intervals after daily real-data workflows are stable.
- **DATA2-03**: App can normalize candles into child tables or a warehouse-style storage model if JSONB chunk storage becomes a bottleneck.
- **MET2-01**: App can add broader analytics such as strategy comparison, parameter sweeps, benchmarks, and advanced risk metrics.

### Product Hardening

- **AUTH2-01**: App can add authentication, authorization, and multi-user account separation before public or team deployment.
- **SEC2-01**: App can add stronger credential isolation, rotation workflows, and audit trails before broker trading or public deployment.

## Out of Scope

Explicitly excluded from the v1 roadmap.

| Feature                                    | Reason                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Live broker order placement                | Requires a separate risk, broker API, authorization, and compliance milestone.                               |
| Multi-user accounts and team roles         | The current app is for a single admin user.                                                                  |
| Public SaaS hardening                      | Auth, tenancy, billing, rate limits, and public credential isolation are not part of this milestone.         |
| Intraday backtesting                       | Daily data is the existing model; intraday adds market-hours, volume, licensing, and performance complexity. |
| Generic spreadsheet mapping wizard         | v1 supports one documented OHLCV CSV contract instead of arbitrary file inference.                           |
| Silent sample-data fallback                | Sample data can remain, but only behind explicit demo/development/custom gates.                              |
| Flashy UI overhaul                         | Magic UI polish should clarify operational states, not turn the app into a marketing page.                   |
| Complex multi-currency support             | USD assumptions are acceptable for v1; currency is recorded and displayed for provenance.                    |
| Full market-data warehouse rewrite         | Add provenance and list projections first; normalize candle storage later if scale requires it.              |
| Strategy optimizer or ML signal generation | The milestone is about trustworthy real data, not new strategy intelligence.                                 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| SET-01      | TBD   | Pending |
| SET-02      | TBD   | Pending |
| SET-03      | TBD   | Pending |
| SET-04      | TBD   | Pending |
| KEY-01      | TBD   | Pending |
| KEY-02      | TBD   | Pending |
| KEY-03      | TBD   | Pending |
| KEY-04      | TBD   | Pending |
| KEY-05      | TBD   | Pending |
| DATA-01     | TBD   | Pending |
| DATA-02     | TBD   | Pending |
| DATA-03     | TBD   | Pending |
| DATA-04     | TBD   | Pending |
| DATA-05     | TBD   | Pending |
| DATA-06     | TBD   | Pending |
| PROV-01     | TBD   | Pending |
| PROV-02     | TBD   | Pending |
| PROV-03     | TBD   | Pending |
| PROV-04     | TBD   | Pending |
| PROV-05     | TBD   | Pending |
| PROV-06     | TBD   | Pending |
| BT-01       | TBD   | Pending |
| BT-02       | TBD   | Pending |
| BT-03       | TBD   | Pending |
| BT-04       | TBD   | Pending |
| BT-05       | TBD   | Pending |
| BT-06       | TBD   | Pending |
| BT-07       | TBD   | Pending |
| CSV-01      | TBD   | Pending |
| CSV-02      | TBD   | Pending |
| CSV-03      | TBD   | Pending |
| CSV-04      | TBD   | Pending |
| CSV-05      | TBD   | Pending |
| MET-01      | TBD   | Pending |
| MET-02      | TBD   | Pending |
| MET-03      | TBD   | Pending |
| CHART-01    | TBD   | Pending |
| CHART-02    | TBD   | Pending |
| CHART-03    | TBD   | Pending |
| CHART-04    | TBD   | Pending |
| UI-01       | TBD   | Pending |
| UI-02       | TBD   | Pending |
| UI-03       | TBD   | Pending |
| UI-04       | TBD   | Pending |
| UI-05       | TBD   | Pending |

**Coverage:**

- v1 requirements: 45 total
- Mapped to phases: 0
- Unmapped: 45 ⚠️

---

_Requirements defined: 2026-04-26_
_Last updated: 2026-04-26 after initial definition_
