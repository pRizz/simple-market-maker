---
generated_by: gsd-discuss-phase
lifecycle_mode: interactive
phase_lifecycle_id: 01-2026-04-26T16-55-02
generated_at: 2026-04-26T16:55:02.780Z
---

# Phase 1: Provider Settings and Secrets - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Mode:** Recommended Review

<domain>

## Phase Boundary

Phase 1 delivers the single-admin settings and secrets foundation for real market data. The admin can open a settings page, configure provider defaults, configure the default missing-data behavior, control sample/demo data visibility, manage provider API keys safely, validate saved keys, and let provider-backed fetches prefer persisted keys while preserving the existing environment fallback during migration.

This phase does not implement the full backtest missing-data fetch lifecycle, progress orchestration, Twelve Data fetch adapter, CSV import, market-data provenance schema expansion, volatility metrics, chart source labels, or broker/live-order features. Those belong to later roadmap phases.

</domain>

<decisions>

## Implementation Decisions

### Settings Surface

- **D-01:** Add a dedicated `/settings` page reachable from app navigation or the home page actions.
- **D-02:** Keep the settings page operational and data-forward. It should focus on provider defaults, missing-data behavior, sample/demo visibility, and provider key readiness.
- **D-03:** Persist settings in a single-row `app_settings` table with at least `defaultProvider`, `missingDataBehavior`, and `showSampleData` or an equivalent sample gate.
- **D-04:** Default settings should be `alpha_vantage` as the provider, `confirm_before_fetch` as the missing-data behavior, and sample/demo data hidden from normal real-data flows.
- **D-05:** The silent-fetch setting may be stored now, but actual silent fetch progress and run orchestration are Phase 3 work.

### Provider Registry

- **D-06:** Add a provider registry descriptor layer rather than scattering provider metadata across UI and services.
- **D-07:** Provider descriptors should include provider id, display label, implementation status, key requirement, environment fallback name when applicable, supported intervals, and a short safe status/help description.
- **D-08:** Alpha Vantage is the implemented real provider for this phase.
- **D-09:** Sample data remains available only as a gated demo/development source.
- **D-10:** Twelve Data may appear as a planned or disabled descriptor if useful for key/settings UI, but the actual Twelve Data adapter and provider behavior belong to Phase 4.

### Provider API Key CRUD

- **D-11:** Add a `provider_api_keys` table for single-admin provider credentials.
- **D-12:** For v1, allow one saved key per provider. Replacing a key should update that provider's saved secret and metadata rather than creating a multi-key vault.
- **D-13:** Store server-only secret material plus safe metadata: provider id, masked suffix, enabled status, validation status, validation message or code, last validated timestamp, created timestamp, and updated timestamp.
- **D-14:** The browser must never receive a raw saved key after submission. Lists and detail views should receive only safe metadata.
- **D-15:** Delete should remove the saved provider key. Disable should keep the key but exclude it from provider-backed fetches.

### Secret Storage and Resolution

- **D-16:** Use a server-only crypto helper built on `node:crypto` AES-GCM with a non-public `PROVIDER_KEYS_ENCRYPTION_SECRET` environment variable.
- **D-17:** If the encryption secret is missing, saved-key create, update, and decrypt paths should fail closed with a safe user-facing error. Existing environment fallback can still be used during migration when no saved key is needed.
- **D-18:** Persisted keys take precedence over environment keys for provider-backed fetches.
- **D-19:** Keep the existing `ALPHA_VANTAGE_API_KEY` fallback read-only. The UI may show that an environment fallback is configured, but it must not reveal the value.
- **D-20:** Do not introduce hosted secret managers, multi-user credential ownership, or account/team abstractions in this phase.

### Key Validation

- **D-21:** Validation should be an explicit admin action, not an automatic request on every settings page load.
- **D-22:** Validation should run a minimal provider check and record a sanitized success or failure status with a timestamp.
- **D-23:** Provider validation responses must not expose raw request URLs, raw keys, or unsanitized provider response bodies to the browser.
- **D-24:** The exact validation symbol/range is implementation discretion, but it should use a stable liquid US equity, be injectable for tests, and avoid expensive or broad provider calls.

### UI and Magic UI

- **D-25:** Reuse the existing app shell patterns first: `PageHeader`, `DataTable`, `StatCard`, `EmptyState`, and current Tailwind styling.
- **D-26:** Use Magic UI selectively only where it clarifies provider readiness, validation, loading, or empty states. A copied/adapted Magic Card-style provider status surface is acceptable.
- **D-27:** Do not initialize a full shadcn rewrite or broad Magic UI visual overhaul in this phase. Larger Magic UI polish belongs to Phase 7.
- **D-28:** Keep the UI single-admin and pragmatic. No auth, user profile, team, billing, or public SaaS settings.

### the agent's Discretion

- Exact route placement, page copy, field labels, form component decomposition, and action button layout are implementation discretion as long as the page is reachable and clear.
- The planner may decide whether provider keys are edited inline, through modal/dialog UI, or through simple forms.
- The planner may decide whether to show provider status as cards above a table or as a compact table with detail panels, as long as raw secrets never cross the server/client boundary.
- The planner may choose the minimal copied Magic UI component surface or defer Magic UI to a later phase if it would cause disproportionate setup churn.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and Phase Scope

- `.planning/PROJECT.md` - Product vision, constraints, and key decisions around real data, single-admin settings, provider keys, confirm-before-fetch, and sample-data gates.
- `.planning/REQUIREMENTS.md` - Phase 1 requirements `SET-01` through `SET-04` and `KEY-01` through `KEY-05`.
- `.planning/ROADMAP.md` - Phase 1 goal, success criteria, dependencies, and later-phase boundaries.
- `.planning/STATE.md` - Current focus, phase ordering notes, and unresolved phase flags.

### Research

- `.planning/research/SUMMARY.md` - Research synthesis and Phase 1 rationale.
- `.planning/research/STACK.md` - Provider settings, API-key storage, Magic UI dependency guidance, and provider recommendations.
- `.planning/research/FEATURES.md` - Feature priority, anti-features, and provider/settings expectations.

### Codebase Maps

- `.planning/codebase/ARCHITECTURE.md` - Current functional-core/server-shell boundaries, provider flow, service factories, and server-only expectations.
- `.planning/codebase/STRUCTURE.md` - Where to add settings, provider, DB, route, and test code.
- `.planning/codebase/CONVENTIONS.md` - Naming, result-union, nullable `maybe` naming, and import conventions.
- `.planning/codebase/CONCERNS.md` - Relevant risks around no auth, raw provider errors, environment singletons, external provider behavior, and form failure states.
- `.planning/codebase/TESTING.md` - Existing Vitest patterns and test placement.

### Repo Guidance

- `AGENTS.md` - Repo-local and Bright Builds entrypoint instructions.
- `AGENTS.bright-builds.md` - Managed Bright Builds workflow and highest-signal engineering rules.
- `standards-overrides.md` - Local standards exception file.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/components/ui/shell.tsx` - Existing `PageHeader`, `Shell`, `Card`, `EmptyState`, and layout primitives for a settings page.
- `src/components/ui/data-table.tsx` - Existing client table primitive for key metadata and provider rows.
- `src/components/ui/stat-card.tsx` - Existing metric/status card primitive for provider readiness summaries.
- `src/modules/market-data/server/market-data-provider.ts` - Existing provider interface to keep provider-backed fetch behavior swappable.
- `src/modules/market-data/server/alpha-vantage-market-data-provider.ts` - Existing Alpha Vantage adapter and env-key fallback behavior to migrate behind credential resolution.
- `src/modules/market-data/server/provider-factory.ts` - Current provider selection point that should be adapted to registry/settings/credential resolution.

### Established Patterns

- Server modules that touch DB, environment, network providers, or secrets should start with `import "server-only";`.
- Boundary parsing uses Zod and returns discriminated unions with `ok: true` / `ok: false`.
- Database schema definitions live in `src/modules/db/schema.ts`; migrations are generated under `src/modules/db/migrations/`.
- Services are factory functions with optional dependencies for test injection, then exposed through singleton accessors for runtime use.
- Tests live under `test/` by feature and use explicit Arrange, Act, Assert comments.

### Integration Points

- Add `src/app/settings/page.tsx` for the settings UI.
- Add settings API routes under `src/app/api/settings/` or feature-specific route handlers that call server services.
- Add a settings module under `src/modules/settings/` or another narrow feature module with `domain/` and `server/` boundaries.
- Add provider key and app settings tables to `src/modules/db/schema.ts` and generate a migration.
- Update provider factory/service code so provider-backed fetches can resolve saved keys first and `ALPHA_VANTAGE_API_KEY` as fallback.
- Update `.env.example` and README documentation for `PROVIDER_KEYS_ENCRYPTION_SECRET` and the migration behavior.

</code_context>

<specifics>

## Specific Ideas

- The user wants a nice settings page with basic sensible knobs and CRUD for provider API keys.
- The app is single-user/single-admin for now.
- Confirm-before-fetch is the default for missing data, while silent fetch is allowed only through a settings knob and must still show visible progress when Phase 3 implements it.
- Sample data should remain available, but only through an explicit demo/development/custom-data gate.
- Magic UI should be subtle and practical: refined cards, tables, empty states, loading states, and provider/status niceties rather than a marketing-style redesign.

</specifics>

<deferred>

## Deferred Ideas

- Full missing-data preflight, confirm modal, silent-fetch progress, request dedupe, and quota-aware fetch lifecycle belong to Phase 3.
- Twelve Data provider adapter and second-provider behavior belong to Phase 4 after validation with a real Basic key.
- CSV import and custom market-data source workflows belong to Phase 5.
- Volatility metrics and metric correctness belong to Phase 6.
- Provider-labeled charts and broader Magic UI polish belong to Phase 7.
- Live brokerage integrations, order ladders, real P/L dashboards, and real order placement belong to a future milestone.

</deferred>

---

*Phase: 01-provider-settings-and-secrets*
*Context gathered: 2026-04-26*
