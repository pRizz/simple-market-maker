# Domain Pitfalls: Real-Data-First Backtesting

**Project:** Simple Market Maker
**Research dimension:** Pitfalls for real market data providers, API-key storage, missing-data fetch UX, CSV import, volatility metrics, provider-labeled charts, and Magic UI polish
**Researched:** 2026-04-26
**Overall confidence:** MEDIUM-HIGH

## Research Basis

This file incorporates the current project context from `.planning/PROJECT.md`, the codebase concerns and architecture maps, and current public provider/UI/security documentation.

Key local concerns that materially affect this milestone:

- External provider fetches are currently synchronous, quota-sensitive, and have no fetch lifecycle, retry, backoff, deduplication, or quota coordination.
- Backtests currently choose sample versus stored data through `MARKET_DATA_SOURCE`, which is an environment switch rather than a product-level data decision.
- `market_data_chunks` currently stores source, interval, range, candle count, candles JSON, and fetch time, but not provider-specific metadata such as adjustment mode, currency, exchange timezone, request id, API usage, or import schema.
- Stored-data matching currently selects by ticker, interval, and range, then orders by newest fetch; it does not distinguish provider, adjusted status, currency, or custom import lineage.
- List views parse large JSON artifacts today; real-data-first flows will multiply candle and run artifact volume.
- Known metric bugs already exist around win rate and exposure. Adding volatility metrics before fixing metric correctness would deepen user trust risk.
- Current routes have no authentication, authorization, CSRF protection, request rate limiting, or safe error taxonomy. Single-admin is acceptable for v1, but server-side provider keys raise the sensitivity of this gap.
- Date parsing currently accepts impossible dates through JavaScript normalization.

## Suggested Phase Labels

Use these labels as roadmap targets when assigning the warnings below:

| Phase                                          | Purpose                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Phase 1: Provider Settings and Secrets         | API-key CRUD, provider settings, server-only secret handling, safe errors                     |
| Phase 2: Data Provenance Schema                | provider/import metadata, adjusted/raw state, currency, timezone, source identity, migrations |
| Phase 3: Fetch Lifecycle and Missing-Data UX   | coverage check, confirm-before-fetch, visible progress, dedupe, quota/backoff                 |
| Phase 4: CSV Import                            | mapping, preview, row validation, custom-source persistence                                   |
| Phase 5: Backtest Metrics Correctness          | known metric fixes, volatility metrics, artifact versioning                                   |
| Phase 6: Provider-Labeled Charts and UI Polish | chart labels, loading/empty states, Magic UI restraint, responsive verification               |
| Phase 7: Operability Hardening                 | pagination/projections, limits, observability, deploy readiness, auth before public use       |

## Critical Pitfalls

### Pitfall 1: Treating Provider Fetches as Ordinary Form Submissions

**What goes wrong:** A missing-data backtest can trigger several provider requests in one HTTP request, exhaust a free or low-tier quota, fail halfway, and leave the UI with only a generic error. Alpha Vantage's standard free limit is 25 requests per day; Polygon/Massive free stock access is limited to 5 API calls per minute; Twelve Data uses minute-reset API credits and returns 429 when credits are exhausted.

**Warning signs:**

- A "Run backtest" button calls providers directly without a fetch job, idempotency key, or coverage check.
- The UI retries by letting users click submit again.
- Provider errors are shown as raw strings.
- There is no distinction between "missing data", "fetch queued", "fetch failed", "quota exhausted", and "provider returned no candles".

**Prevention strategy:** Build a fetch lifecycle before enabling silent fetches. Add provider-aware rate limits, request deduplication, timeout handling, quota-error mapping, and a durable fetch status model, even if v1 executes the job inline. Use a single source identity for idempotency: provider, ticker, interval, start date, end date, adjustment mode, currency, and import/provider metadata. Default to confirm-before-fetch with provider, range, estimated request count, and quota note.

**Phase:** Phase 3: Fetch Lifecycle and Missing-Data UX, with prerequisites from Phase 1 and Phase 2.

**Test/verification implication:** Unit-test fake providers for 429/quota, malformed response, empty response, timeout, and duplicate concurrent requests. Add service tests proving duplicate fetch requests produce one chunk/job or a clear "already fetched/in progress" result. Verify a failed provider request does not create a completed chunk.

**Confidence:** HIGH, based on official Alpha Vantage, Polygon/Massive, and Twelve Data usage documentation plus current synchronous app design.

### Pitfall 2: Persisting Candles Without Durable Provenance

**What goes wrong:** Two chunks with the same ticker/range look interchangeable even if they came from different providers, different adjustment policies, different currencies, different exchange timezones, or a user CSV. Backtests silently use the newest matching chunk, making results non-reproducible.

**Warning signs:**

- `findMatchingChunk()` matches only ticker, interval, and range.
- Charts label only the ticker, not provider/import, adjustment state, currency, exchange, and fetched/imported timestamp.
- A backtest run record does not store the exact market-data chunk id and source metadata used.
- The database schema keeps provider metadata only in freeform notes.

**Prevention strategy:** Make source provenance part of the data model before adding a second provider or CSV import. Store provider id/source type, provider display name, adjustment mode, currency, exchange timezone, request parameters, response/request id when available, fetched/imported timestamp, and import filename/schema hash for CSV. Persist the selected market-data chunk id and source snapshot on each run.

**Phase:** Phase 2: Data Provenance Schema.

**Test/verification implication:** Add repository/service tests proving two chunks for the same ticker/date range remain distinct when provider, adjustment mode, currency, or import id differs. Add backtest tests proving the run artifact records the selected chunk id/source snapshot.

**Confidence:** HIGH, based on current schema/repository behavior and provider docs showing materially different metadata.

### Pitfall 3: Mixing Adjusted and Raw Prices

**What goes wrong:** Backtests compare or combine candles whose prices have different corporate-action treatment. Alpha Vantage `TIME_SERIES_DAILY` is raw as-traded daily data and points users to the adjusted endpoint for split/dividend-adjusted fields; Polygon/Massive aggregates are split-adjusted by default and can be requested unadjusted; Twelve Data supports adjustment modes such as `all`, `splits`, `dividends`, and `none`, with a default of splits. Backtesting on adjusted prices can also introduce look-ahead-style interpretation problems if the engine treats adjusted historical prices as executable historical fills.

**Warning signs:**

- The app says "real data" without saying raw, split-adjusted, dividend-adjusted, or provider-adjusted.
- A backtest can use a chunk without checking its adjustment mode.
- Volatility metrics can be calculated across split gaps without knowing whether data is adjusted.
- Provider-labeled charts omit adjusted/unadjusted status.

**Prevention strategy:** Store `adjustmentMode` as a first-class field and show it everywhere data is selected or charted. For v1, treat adjusted data as research data and do not imply live-executable fill realism unless the engine models corporate actions. Never compare chunks or fulfill a backtest request across adjustment modes without explicit user selection. Include adjustment mode in the run's engine/source snapshot.

**Phase:** Phase 2: Data Provenance Schema before Phase 5 metrics and Phase 6 charts.

**Test/verification implication:** Add fixtures for split-like price series and verify raw versus adjusted chunks produce separately labeled runs. Add tests that stored-data matching refuses to use an adjustment mode that does not match the backtest request/settings.

**Confidence:** HIGH, based on official provider documentation and QuantConnect's backtesting bias guidance.

### Pitfall 4: Assuming Date Coverage Means Calendar-Day Completeness

**What goes wrong:** Weekend/holiday gaps are incorrectly flagged as missing, while real missing trading days pass silently. Daily candles can arrive in provider/exchange local dates while the app currently normalizes dates to UTC midnight. Missing bars inside a range can distort volatility, drawdown, exposure, and fill timing.

**Warning signs:**

- Validation compares only start and end dates plus candle count.
- The app displays "complete" if at least one candle exists.
- Daily dates are stored only as `Date` timestamps with UTC assumptions.
- CSV import accepts duplicate, out-of-order, or impossible dates.

**Prevention strategy:** Represent daily candles by trading date plus optional timestamp/timezone metadata. Add a coverage checker that distinguishes non-trading days from suspicious missing trading days. Until an exchange calendar is implemented, classify gaps as warnings, not hard failures, and show them on import/fetch review. Strictly parse `YYYY-MM-DD` with a round-trip check so impossible dates such as `2024-02-31` are rejected.

**Phase:** Phase 2: Data Provenance Schema and Phase 4: CSV Import.

**Test/verification implication:** Add parser tests for impossible dates, duplicate dates, unsorted rows, weekend gaps, a one-day holiday-style gap, and a midweek missing candle. Verify charts and metrics receive sorted, de-duplicated candle series.

**Confidence:** HIGH for local date bug and timezone risk; MEDIUM for exact exchange-calendar scope because v1 can use warnings instead of a full calendar model.

### Pitfall 5: Letting API-Key CRUD Expose Secrets

**What goes wrong:** Provider keys appear in database snapshots, API responses, rendered HTML, logs, form errors, or client bundles. A single-admin app still has server-side credentials that can consume paid provider quota or violate provider terms if leaked.

**Warning signs:**

- CRUD responses return full key values after create/update.
- Keys are stored in plaintext database columns with no encryption plan.
- Key field names use `NEXT_PUBLIC_` or are read in client components.
- Provider errors echo request URLs that contain keys.
- The settings page has no masking, test-connection action, delete flow, or rotation UX.

**Prevention strategy:** Keep provider-key operations server-only. Store only encrypted key material plus non-secret metadata such as provider, label, created/updated/tested timestamps, and masked suffix. Use a server-side encryption key from environment/KMS, separated from the database. Never display a stored key after save; support replace, test, disable, and delete. Redact provider request URLs and raw provider payloads from user-facing errors. Auth can remain deferred for single-admin local use, but public deployment must be blocked until an access boundary exists.

**Phase:** Phase 1: Provider Settings and Secrets.

**Test/verification implication:** Add tests that create/update/list/get settings never return the full key, that masked values are deterministic and non-sensitive, and that thrown provider errors do not include the key. Add static review checks for `NEXT_PUBLIC_*KEY` and full-key rendering.

**Confidence:** HIGH, based on OWASP secrets/cryptographic storage guidance and Next.js environment-variable behavior.

### Pitfall 6: Silent Auto-Fetch Consuming Quota and Creating Surprise Data

**What goes wrong:** A backtest that used to run instantly starts making invisible network calls. Users burn daily quotas, create duplicate chunks, and cannot tell whether a run used old stored data, newly fetched data, sample data, or custom import data.

**Warning signs:**

- "Silent fetch" is implemented as a boolean that bypasses confirm UI but not as a visible job state.
- The app does not show provider/range details before consuming quota by default.
- A run can create market data and run against it without a source banner.
- Multiple tabs can submit the same missing-data fetch.

**Prevention strategy:** Keep confirm-before-fetch as the default. Implement silent fetch only after fetch dedupe, quota-awareness, and visible progress exist. Silent mode should still show a spinner/toast/modal and should store a run event that says the run created or reused market data. Add a budget cap or "do not fetch more than N provider calls without confirmation" setting.

**Phase:** Phase 3: Fetch Lifecycle and Missing-Data UX.

**Test/verification implication:** Test the default path requires confirmation, the silent path still emits progress state and source details, and concurrent requests are deduped. Verify no sample fallback happens unless the user explicitly chooses demo/custom data.

**Confidence:** HIGH, based on milestone constraints and quota-sensitive provider docs.

### Pitfall 7: Leaving Sample Data as an Invisible Fallback

**What goes wrong:** A "real-data-first" backtest silently falls back to sample data because the stored-data provider cannot find a matching chunk or the environment still defaults to sample. The resulting chart looks polished and plausible but is synthetic.

**Warning signs:**

- `MARKET_DATA_SOURCE` still controls production backtest source behavior.
- Error copy tells users to set an environment variable.
- Sample data appears in a normal provider selector without a demo/development warning.
- Run results do not store the candle source used.

**Prevention strategy:** Move source selection into product settings and per-run source resolution. Make sample data an explicit "demo/development" source with visible labeling and require deliberate selection. Remove environment-variable instructions from user-facing errors. Persist source type and chunk/import id on every run.

**Phase:** Phase 3: Fetch Lifecycle and Missing-Data UX, after Phase 2 source identity exists.

**Test/verification implication:** Add service tests proving missing real data returns "needs fetch/selection" rather than sample candles. Add UI/component or route tests for demo-source labeling.

**Confidence:** HIGH, based on current `MARKET_DATA_SOURCE` behavior and milestone requirements.

### Pitfall 8: Treating CSV Import as a Shortcut Around Validation

**What goes wrong:** Custom CSV data becomes a backdoor for malformed, unsorted, duplicate, timezone-shifted, split-mixed, or malicious-looking data. Incorrect OHLC values can produce impossible candles and false fills. Large files can freeze the browser or API route.

**Warning signs:**

- CSV parsing uses ad hoc string splitting.
- There is no column mapping/preview step.
- The importer accepts rows where high is below open/close, low is above open/close, volume is negative, dates are invalid, or ticker/source metadata is missing.
- Import stores only notes instead of import schema and adjustment/currency metadata.
- Large files are fully loaded into React state or parsed synchronously in a request.

**Prevention strategy:** Use a real CSV parser and import pipeline. Support column mapping, preview, row-level errors, strict candle validation, duplicate-date handling, sorted output, import metadata, file size/row caps, and clear "custom import" labeling. For larger files, stream or chunk parsing; Papa Parse documents worker/streaming modes for browser parsing, and server imports should follow the same memory discipline. Sanitize any imported text that might later be exported as CSV.

**Phase:** Phase 4: CSV Import.

**Test/verification implication:** Add fixtures for quoted fields, embedded commas/newlines, duplicate dates, invalid OHLC, negative volume, blank rows, malformed rows, impossible dates, formula-looking text, and large-file row limits. Verify partial invalid imports do not create completed chunks unless the accepted rows and rejected rows are explicitly confirmed.

**Confidence:** HIGH for CSV parsing/security hazards from RFC 4180, OWASP CSV injection, and Papa Parse docs; MEDIUM for exact parser choice because the stack decision may be made later.

### Pitfall 9: Adding Volatility Metrics Before Fixing Existing Metric Semantics

**What goes wrong:** New volatility, Sharpe-style, or drawdown-adjacent metrics inherit existing metric bugs and data-quality assumptions. The app becomes more polished while financial summaries remain wrong.

**Warning signs:**

- Volatility is calculated on prices instead of returns without naming it as price dispersion.
- Annualization assumes calendar days instead of trading-day periods without documenting it.
- A one-candle or sparse series returns a precise-looking metric.
- Known win-rate and exposure bugs remain unresolved while new metrics are added.

**Prevention strategy:** Fix current win-rate and exposure calculations before adding volatility metrics. Implement metrics in pure domain functions with explicit method names: daily close-to-close return volatility, annualization factor, minimum sample count, handling of missing bars, and currency/source assumptions. Store metric method/version in run artifacts.

**Phase:** Phase 5: Backtest Metrics Correctness.

**Test/verification implication:** Add deterministic fixtures where expected returns, sample standard deviation, annualized volatility, max drawdown, win rate, and exposure are hand-calculable. Include tests for one candle, constant price, missing middle candle, split-like gap, and fees/slippage edge cases.

**Confidence:** HIGH, based on current codebase concerns and finance/backtesting metric guidance.

### Pitfall 10: Chart Polish Obscuring Data Lineage

**What goes wrong:** Magic UI effects, refined cards, and attractive ECharts views make results look more trustworthy while hiding source caveats. Users inspect a chart without seeing provider, adjustment mode, currency, import label, stale data, or missing gaps.

**Warning signs:**

- Chart headings say only "AAPL candlestick chart".
- Loading states use generic shimmer effects with no provider/range details.
- Empty states encourage "try sample data" as the default path.
- Magic UI background/effect components compete with data density.
- ECharts containers render blank or clipped after responsive layout changes.

**Prevention strategy:** Treat provenance labels as chart data, not decoration. Every market-data and run chart should show provider/import, ticker, date range, interval, adjustment mode, currency, and fetch/import timestamp. Use Magic UI selectively for empty/loading/card refinement, not as a visual rewrite. ECharts docs require a container with explicit width/height before initialization and resizing when containers change, so keep stable chart dimensions and resize handling.

**Phase:** Phase 6: Provider-Labeled Charts and UI Polish.

**Test/verification implication:** Add UI assertions or screenshot checks that source labels are visible on chart surfaces. Verify ECharts charts have nonzero dimensions on desktop and mobile, and that empty/loading/error states include provider/range context.

**Confidence:** HIGH for UI provenance need and ECharts sizing behavior; MEDIUM for Magic UI integration details because component selection is design-dependent.

## Moderate Pitfalls

### Pitfall 11: Provider Terms and Licensing Treated as Implementation Details

**What goes wrong:** A free or individual provider plan is used in a deployed app beyond its terms, or the app implies real-time data when the plan provides end-of-day or delayed access. Polygon/Massive terms and pricing distinguish individual/non-commercial access and plan-specific recency; Alpha Vantage notes real-time and delayed US market data entitlement requirements.

**Warning signs:**

- Provider choice is based only on endpoint shape and not terms, recency, and plan eligibility.
- UI labels say "live" or "real-time" for daily/end-of-day data.
- The roadmap adds public SaaS, shared teams, or broker trading before data terms are revisited.

**Prevention strategy:** Record provider plan, data recency, permitted use, and business/personal eligibility in provider settings/docs. Use "daily", "end-of-day", "delayed", or "provider-reported recency" labels instead of "live". Keep public SaaS and live broker trading out of this milestone unless provider contracts are revisited.

**Phase:** Phase 1: Provider Settings and Secrets and Phase 7: Operability Hardening.

**Test/verification implication:** Add provider metadata tests and UI copy checks for "live"/"real-time" misuse. Treat terms review as a release checklist item, not a unit test.

**Confidence:** MEDIUM-HIGH, based on official provider pages and terms snippets.

### Pitfall 12: Raw Provider Errors Leaking Internals

**What goes wrong:** Provider, database, and repository exceptions are surfaced directly to users. This can reveal keys, URLs, infrastructure names, provider payload details, or confusing implementation messages.

**Warning signs:**

- Catch blocks return `error.message` directly.
- Form errors include provider raw notes without classification.
- There is no internal log/correlation id distinction from user-facing copy.

**Prevention strategy:** Add a provider/error taxonomy: validation, missing key, quota exhausted, unauthorized key, unsupported symbol, no candles, provider unavailable, timeout, malformed provider response, internal persistence failure. Map each to safe user copy; log detailed data server-side with redaction.

**Phase:** Phase 1: Provider Settings and Secrets and Phase 3: Fetch Lifecycle.

**Test/verification implication:** Add tests that synthetic errors containing URLs, API keys, or SQL-ish text are redacted from API responses while preserving actionable status codes.

**Confidence:** HIGH, based on current service catch blocks and security concerns.

### Pitfall 13: Provider Enum Expansion Creating Schema Drag

**What goes wrong:** Each new provider or source type requires PostgreSQL enum migrations and code changes across validation, UI, providers, and repositories. This is acceptable for one extra provider, but becomes brittle if provider settings become user-configurable records.

**Warning signs:**

- Provider settings CRUD stores provider identity in one table while market-data chunks still use a hard-coded enum.
- A custom CSV import needs to be forced into the same enum as external providers.
- Provider display names and capabilities are duplicated in client code.

**Prevention strategy:** For v1, a controlled enum migration is fine for one second provider plus `custom_import`. Do not add open-ended provider creation. Centralize provider capability metadata in one server-owned registry and expose safe display metadata to the UI. Revisit provider tables only when user-defined providers become a requirement.

**Phase:** Phase 2: Data Provenance Schema.

**Test/verification implication:** Add schema/migration tests or at least repository tests for old `sample`/`alpha_vantage` rows and new provider/import rows. Verify validation rejects unsupported provider ids cleanly.

**Confidence:** MEDIUM, based on current `pgEnum` usage and likely v1 scope.

### Pitfall 14: Large Real-Data Chunks Amplifying JSONB and List-View Costs

**What goes wrong:** Real providers and CSV imports create larger candle arrays. Current list methods parse complete candle JSON for list pages, and run lists stringify full artifacts. The app slows down as the workspace grows.

**Warning signs:**

- Market-data list pages select full `candles_json`.
- Backtest run list pages select full chart, fill, and price artifacts.
- There is no date-range cap, candle-count cap, pagination, or projection method.

**Prevention strategy:** Before broad real-data usage, add compact list projections, pagination, and range/candle limits. Keep rich candle/artifact parsing to detail pages and run execution. Consider child candle tables later, but do not block v1 if caps and projections are in place.

**Phase:** Phase 7: Operability Hardening, with small projection work pulled earlier if CSV/import ranges are large.

**Test/verification implication:** Add repository tests proving list methods do not parse candles/artifacts. Add boundary tests for max date range, max rows, and pagination.

**Confidence:** HIGH, based on current codebase concerns.

### Pitfall 15: Backtest Run Artifacts Not Versioned for Source Changes

**What goes wrong:** After schema/source/metric changes, old runs are rendered as if they used the new semantics. JSON artifact parsing already trusts persisted shape; adding source metadata and metrics increases drift risk.

**Warning signs:**

- Run detail page parses JSON with type assertions.
- Engine version remains `ladder-engine@1` after data-source semantics change.
- Old runs lack source snapshot but the UI shows current provider assumptions.

**Prevention strategy:** Add artifact versions and parsers at repository/page boundaries. Bump engine/source version when run inputs, source selection, adjusted/raw handling, or metric formulas change. Render old runs with "legacy source metadata unavailable" instead of inventing provenance.

**Phase:** Phase 5: Backtest Metrics Correctness.

**Test/verification implication:** Add malformed/legacy artifact tests and run-detail recovery-state tests. Verify old rows do not crash rendering and do not claim unavailable source fields.

**Confidence:** HIGH, based on current artifact parsing concern.

### Pitfall 16: Import/Fetch Workflows Reusing Large Form Components

**What goes wrong:** Provider settings, missing-data confirmation, CSV mapping, and fetch progress are added into already-large client form components. State, validation, preview, and network behavior become harder to test and regress.

**Warning signs:**

- Existing `BacktestForm` or `MarketDataForm` grows to own provider selection, key state, CSV preview, fetch progress, and chart preview.
- UI state transitions are only manually testable.
- Submission state remains stuck after non-JSON or network failures.

**Prevention strategy:** Split flows by responsibility: pure form schema/defaults, API submit helpers, provider selector, fetch confirmation modal, progress/status component, CSV preview/mapping component, and source summary component. Keep service orchestration server-side.

**Phase:** Phase 1 through Phase 4 as each flow is touched.

**Test/verification implication:** Unit-test pure mappers and submit helpers. Add failure-state tests for non-JSON responses and network rejection where practical.

**Confidence:** HIGH, based on current component-size and failure-state concerns.

## Minor Pitfalls

### Pitfall 17: No Clear Empty-State Taxonomy

**What goes wrong:** "No data" can mean no provider key, no stored chunks, no matching range, fetch in progress, provider returned no candles, CSV rejected all rows, or a real provider outage. Generic empty states will push users toward sample data or repeated failed fetches.

**Warning signs:** Empty cards use the same message across settings, market data, run detail, and charts.

**Prevention strategy:** Define empty/error states by use case and include next actions: add key, test key, fetch missing range, import CSV, view failed fetch, or explicitly run demo data.

**Phase:** Phase 3 and Phase 6.

**Test/verification implication:** Add UI-state fixtures for each empty/error status and verify copy/actions differ.

**Confidence:** MEDIUM-HIGH.

### Pitfall 18: Provider Comparison Hidden Behind "Second Provider" Scope

**What goes wrong:** A second provider is added because it has a free tier, but its coverage, recency, adjustment defaults, terms, and quotas do not improve the actual backtesting workflow.

**Warning signs:** Provider selection is decided before mapping required fields and usage constraints.

**Prevention strategy:** Choose the second provider only if it improves v1: daily OHLCV for US stocks, reliable historical range, reasonable free/low-friction tier, clear adjusted/raw behavior, usable metadata, and terms compatible with single-admin research. Otherwise document deferral.

**Phase:** Phase 1/2 before implementation.

**Test/verification implication:** Add a provider contract test suite that every provider must pass: request construction, response parsing, quota/error mapping, adjusted/raw metadata, empty response, and date filtering.

**Confidence:** MEDIUM-HIGH.

### Pitfall 19: Currency Assumptions Becoming Invisible Debt

**What goes wrong:** The app assumes USD, but providers can return global equities, forex, crypto, or metadata with currency/exchange fields. Charts and metrics may mix USD assumptions with non-USD data.

**Warning signs:** Currency exists only in UI copy or notes, not persisted metadata.

**Prevention strategy:** For v1, restrict provider-backed stock backtests to USD equities unless provider metadata says otherwise. Store currency and show "USD assumed" or provider-reported currency. Reject or warn on non-USD imports/providers.

**Phase:** Phase 2.

**Test/verification implication:** Add provider/import tests for missing currency, USD currency, and non-USD warning/rejection behavior.

**Confidence:** MEDIUM.

### Pitfall 20: Over-Polished UI Reducing Operational Density

**What goes wrong:** Magic UI patterns designed for marketing or expressive landing pages make an operational research workstation feel noisy. Dense tables, source labels, and comparison workflows become harder to scan.

**Warning signs:** Animated backgrounds, large gradients, or decorative components appear on data tables, settings, or chart detail pages.

**Prevention strategy:** Use Magic UI for subtle loading, empty, card, and small accent states only. Keep charts, tables, forms, and provider settings quiet, compact, and scannable.

**Phase:** Phase 6.

**Test/verification implication:** Include visual review criteria: no decorative background effects on core dashboard/table/chart surfaces; source labels remain visible above polish.

**Confidence:** MEDIUM-HIGH, based on Magic UI component catalog and product constraints.

## Phase-Specific Warning Matrix

| Phase Topic              | Likely Pitfall                           | Mitigation                                                   | Verification                                                |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| Provider API-key CRUD    | Secret leakage, raw error exposure       | Server-only CRUD, encrypted storage, masking, redaction      | API tests ensure no full key in responses/errors            |
| Provider selection       | Free-tier fit mistaken for product fit   | Provider capability/terms checklist before coding            | Provider contract tests and documented provider decision    |
| Market-data schema       | Provenance too thin                      | Add adjustment, currency, timezone, provider/import metadata | Repository tests for distinct same-range chunks             |
| Missing-data backtest UX | Quota surprise and duplicate fetches     | Confirm-first, dedupe, progress, quota mapping               | Fake-provider 429/concurrency tests                         |
| Silent fetch setting     | Invisible network work                   | Only after lifecycle exists; visible progress and budget cap | UI/service tests for silent visible progress                |
| CSV import               | Malformed/custom data corrupts backtests | Parser, mapping preview, row validation, metadata            | CSV fixture suite with invalid rows and large files         |
| Volatility metrics       | Precise-looking wrong numbers            | Fix existing metric bugs first; pure versioned metrics       | Hand-calculated metrics tests                               |
| Charts                   | Pretty but source-opaque                 | Source labels on every chart and run surface                 | Screenshot/UI checks for provenance visibility              |
| Scaling                  | List pages parse all JSON                | Compact projections, pagination, limits                      | Repository tests assert list projections avoid JSON parsing |
| Deployment               | Single-admin app exposed publicly        | Auth/public-deploy gate before shared use                    | Release checklist and route/security tests later            |

## Source Notes

| Source                                                                                                                        | Relevance                                                               | Confidence  |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| `.planning/PROJECT.md`                                                                                                        | Milestone requirements, constraints, active scope                       | HIGH        |
| `.planning/codebase/CONCERNS.md`                                                                                              | Existing bugs, security gaps, performance bottlenecks                   | HIGH        |
| `.planning/codebase/ARCHITECTURE.md`                                                                                          | Current service/repository/provider architecture                        | HIGH        |
| `.planning/codebase/TESTING.md`                                                                                               | Current test framework and gaps                                         | HIGH        |
| `README.md`                                                                                                                   | Current user-facing workflow and environment switches                   | HIGH        |
| `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`                                                              | Repo workflow and verification expectations                             | HIGH        |
| Bright Builds canonical `standards/` files                                                                                    | Not present in this worktree; used only via loaded sidecar summaries    | LOW         |
| https://www.alphavantage.co/documentation/                                                                                    | Daily/raw/adjusted endpoint behavior and compact/full limits            | HIGH        |
| https://www.alphavantage.co/support/                                                                                          | Free quota, data entitlements, adjusted-method notes                    | HIGH        |
| https://www.alphavantage.co/premium/                                                                                          | Premium quota tiers and no-daily-limit note                             | HIGH        |
| https://support.twelvedata.com/en/articles/5615854-credits                                                                    | Twelve Data credit model, 429 behavior, reset windows                   | HIGH        |
| https://support.twelvedata.com/en/articles/5713553-control-over-api-usage                                                     | Twelve Data usage headers and `/api_usage` endpoint                     | HIGH        |
| https://support.twelvedata.com/en/articles/5214728-getting-historical-data                                                    | Twelve Data date/outputsize nuances and 5,000 point limit               | HIGH        |
| https://support.twelvedata.com/en/articles/5745849-timezones                                                                  | Twelve Data default timezone behavior                                   | HIGH        |
| https://polygon.io/pricing/ and https://massive.com/pricing                                                                   | Polygon/Massive plan limits and historical range tiers                  | MEDIUM-HIGH |
| https://polygon.io/docs/rest/stocks/aggregates/custom-bars                                                                    | Aggregates endpoint fields, ET handling, split-adjusted default, limits | HIGH        |
| https://polygon.io/knowledge-base/article/what-is-the-request-limit-for-polygons-restful-apis                                 | Free REST request limit and paid unlimited note                         | MEDIUM-HIGH |
| https://polygon.io/knowledge-base/article/is-polygons-stock-data-adjusted-for-splits-or-dividends                             | Split-adjusted default and dividend note                                | MEDIUM-HIGH |
| https://polygon.io/legal/market-data-terms-of-service                                                                         | Personal/non-commercial data-use constraints                            | MEDIUM      |
| https://magicui.design/docs/installation                                                                                      | Magic UI install model via shadcn CLI                                   | HIGH        |
| https://magicui.design/docs/components                                                                                        | Magic UI component catalog and effect-heavy component mix               | HIGH        |
| https://echarts.apache.org/handbook/en/concepts/chart-size/                                                                   | ECharts container size/resize/dispose requirements                      | HIGH        |
| https://datatracker.ietf.org/doc/html/rfc4180                                                                                 | CSV format edge cases and interoperability caveats                      | HIGH        |
| https://owasp.org/www-community/attacks/CSV_Injection                                                                         | CSV/formula injection risks and mitigations                             | HIGH        |
| https://www.papaparse.com/docs                                                                                                | Browser CSV parsing, worker/streaming, parse errors                     | MEDIUM-HIGH |
| https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html                                            | Secret storage/rotation guidance                                        | HIGH        |
| https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html                                         | Encryption-at-rest and key-management guidance                          | HIGH        |
| https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables                                     | Server-only versus `NEXT_PUBLIC_` environment behavior                  | HIGH        |
| https://www.quantconnect.com/docs/v2/writing-algorithms/key-concepts/research-guide                                           | Look-ahead, survivorship, overfitting, adjusted-price pitfalls          | HIGH        |
| https://www.quantconnect.com/docs/v2/writing-algorithms/statistics/algorithm-statistics                                       | Backtest statistics and annualization context                           | MEDIUM-HIGH |
| https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/historical-volatility | Historical volatility as annualized standard deviation                  | MEDIUM-HIGH |

## Bottom Line for Roadmap

Do not start with chart polish or silent auto-fetch. The safe order is secrets, provenance, fetch lifecycle, CSV import, metric correctness, then source-labeled chart/UI polish. The most expensive mistakes would be building attractive backtest results that hide whether the data was sample, raw, adjusted, quota-limited, partial, stale, or imported from an invalid CSV.
