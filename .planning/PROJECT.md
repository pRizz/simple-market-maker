# Simple Market Maker

## What This Is

Simple Market Maker is a single-admin stock ladder backtesting app for configuring ladder strategies, fetching and managing market data, running backtests, and reviewing charted results. The current app already persists backtest definitions, market-data chunks, and run results; the next push is to make real market data the polished default path while keeping sample/custom data available behind clearer gates.

The product should feel like a practical trading research workstation: quiet, data-forward, and clear about where every data point came from. Live broker integrations and real order placement are a later milestone, after the real-data backtesting foundation is reliable.

## Core Value

A user can confidently run ladder backtests against clearly sourced real market data and understand the resulting performance from polished charts, metrics, and data provenance.

## Requirements

### Validated

- ✓ User can create, edit, delete, and view persisted ladder backtest definitions — existing
- ✓ User can fetch and persist daily OHLCV market-data chunks for ticker/date ranges — existing
- ✓ User can fetch real daily market data from Alpha Vantage when an API key is configured — existing
- ✓ User can use deterministic sample market data for local development and demos — existing
- ✓ User can browse persisted market-data chunks in a dashboard-style list — existing
- ✓ User can open a market-data detail page with candle, close price, volume, and raw candle views — existing
- ✓ User can run long-only ladder strategy backtests and persist every run result in PostgreSQL — existing
- ✓ User can review run summaries, fill ledgers, equity curves, and drawdowns in the UI — existing
- ✓ User can see visible build provenance in the product chrome — existing

### Active

- [ ] Polish the real market-data fetching flow so provider, ticker, date range, interval, adjusted/unadjusted status, fetch timestamp, and USD currency assumptions are visible and understandable.
- [ ] Add a researched second market-data provider if a reasonable free or low-friction option exists; otherwise document the provider decision and defer the second provider.
- [ ] Distinguish separate market-data fetches as separate persisted rows by provider, ticker, date range, interval, adjusted/unadjusted status, fetch timestamp, and source metadata.
- [ ] Add a settings page with sensible knobs, including the default missing-data behavior for backtests.
- [ ] Add single-admin CRUD for provider API keys and related provider settings.
- [ ] Make backtests real-data-first: when required ticker/date data is missing, ask "fetch this data?" with provider and date details before running by default.
- [ ] Add a settings knob for silent missing-data fetches, while still showing clear fetch progress through a spinner, toast, modal, or equivalent in-product state.
- [ ] Keep synthetic/sample data, but gate it as an explicit demo/development/custom-data path rather than the normal backtesting default.
- [ ] Add CSV import for reasonably structured raw market data so users can bring custom data sources without a provider API.
- [ ] Add volatility metrics and display them in the relevant detail/backtest views.
- [ ] Show clear data-source indications on charts, including which provider or custom import produced the displayed data.
- [ ] Integrate Magic UI components where they improve refined cards, tables, empty states, loading states, and subtle visual polish without making the app feel like a marketing page.
- [ ] Improve chart/detail-page polish so real market data and backtest results are easier to scan and compare.
- [ ] Preserve the current single-admin product assumption for this milestone.

### Out of Scope

- Live broker order placement in v1 — defer to the next milestone after real-data backtesting is reliable.
- Multi-user accounts and role-based access in v1 — this remains a single-admin app for now.
- Public SaaS hardening in v1 — authentication, per-user authorization, team management, and production credential isolation are deferred.
- Complex multi-currency handling in v1 — market data can assume USD unless a provider requires otherwise.
- Advanced broker dashboards in v1 — real positions, real buy/sell orders, exchange execution costs, and live P/L views belong to the broker-integration milestone.

## Context

The repository is a brownfield Bun, Next.js App Router, TypeScript, PostgreSQL, Drizzle, Tailwind, and ECharts application. The codebase map lives in `.planning/codebase/` and identifies a functional-core/server-shell architecture with feature modules under `src/modules/`, App Router pages under `src/app/`, shared UI under `src/components/`, and tests under `test/`.

Market data currently supports persisted chunks, a sample provider, and Alpha Vantage. The README describes Alpha Vantage's free daily endpoint as useful for recent ranges but rate limited. Backtests can currently use sample data or stored data depending on `MARKET_DATA_SOURCE`; this should evolve into a clearer product-level data selection/fetch flow instead of an environment-only switch.

Known implementation concerns that should inform planning:

- Large client form components mix state, submission, validation display, and preview UI.
- Build-safe service handling is duplicated and can mask missing `DATABASE_URL` with placeholders.
- Persisted backtest artifacts use JSON string round-trips and should become more typed at repository boundaries.
- List pages parse large JSON payloads even when they only need metadata.
- Current backtest metrics include known issues around win-rate and exposure calculations.
- External provider fetches are synchronous, quota-sensitive, and lack a richer fetch lifecycle.
- No authentication or authorization layer exists; this is acceptable for the current single-admin milestone but matters before public deployment.

## Constraints

- **Tech stack**: Continue with Bun, Next.js App Router, TypeScript, PostgreSQL, Drizzle ORM, Tailwind CSS, and ECharts — this is the existing working stack.
- **UI system**: Add Magic UI selectively for refined app surfaces, not as a full visual rewrite — the product should stay data-forward and operational.
- **User model**: Design for a single admin user in this milestone — avoid building account/team abstractions prematurely.
- **Market data**: Real market data should become the normal backtest path — sample/synthetic data remains available only through explicit demo/development/custom-data gates.
- **Provider keys**: Persist provider API keys for a single-admin setup — treat them as sensitive, but do not block v1 on a full multi-user credential architecture.
- **Fetch behavior**: Confirm-before-fetch is the default for missing backtest data — silent fetch is allowed only when enabled in settings and must still show progress.
- **Currency**: Default market data assumptions can use USD — deeper currency/exchange modeling is deferred unless required by a chosen provider.
- **Verification**: Use the repo-native `bun run verify` command before commits when implementation changes are made.

## Key Decisions

| Decision                                                                                                                        | Rationale                                                                                                        | Outcome   |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------- |
| Keep v1 focused on real-data backtesting polish, not live trading                                                               | Reliable data acquisition, provenance, and backtest UX are prerequisites for broker execution                    | — Pending |
| Research a second market-data provider before committing to implementation                                                      | Alpha Vantage exists, but provider diversity should be grounded in availability, free tier, and integration cost | — Pending |
| Keep the app single-admin for this milestone                                                                                    | The current user is the admin/operator, and multi-user auth would distract from the real-data foundation         | — Pending |
| Default missing-data backtests to a confirm-and-fetch flow                                                                      | Users should see provider/date details before consuming quotas or creating new data rows                         | — Pending |
| Allow optional silent fetches only with visible progress                                                                        | Convenience should not make network work invisible or confusing                                                  | — Pending |
| Distinguish market-data chunks by provider, ticker, date range, interval, adjusted status, fetch timestamp, and source metadata | Users need to compare and trust distinct provider fetches and custom imports                                     | — Pending |
| Preserve sample data behind explicit gates                                                                                      | Synthetic data is still useful for development, demos, and tests, but should not be the normal user path         | — Pending |
| Add CSV import as a custom-data path                                                                                            | Users may have useful data sources without provider APIs                                                         | — Pending |
| Use Magic UI for subtle app polish only                                                                                         | The interface should improve empty, loading, card, and table states without becoming visually noisy              | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-04-26 after initialization_
