# Phase 1: Provider Settings and Secrets - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-26T16:55:02.780Z
**Phase:** 1-Provider Settings and Secrets
**Mode:** Recommended Review
**Areas discussed:** Settings surface, provider registry, API key CRUD, secret storage, key validation, sample data gate, UI polish, phase scope

---

## Settings Surface

| Option | Description | Selected |
| --- | --- | --- |
| Dedicated `/settings` page | Central single-admin page linked from app navigation or home actions. | yes |
| Inline settings in market-data page | Keeps provider settings near fetches but becomes crowded as keys and defaults grow. | |
| Environment-only configuration | Smallest code change but does not satisfy in-product settings requirements. | |

**User's choice:** Accept recommended dedicated settings page.
**Notes:** The page should expose sensible knobs without adding accounts, teams, or public SaaS settings.

---

## Provider Registry

| Option | Description | Selected |
| --- | --- | --- |
| Add provider registry descriptors | Centralizes provider ids, labels, capabilities, key requirements, and status text. | yes |
| Keep source enum only | Simpler now but keeps provider metadata scattered across UI and services. | |
| Build full provider plugin system | More flexible but too broad for the current single-admin milestone. | |

**User's choice:** Accept recommended provider registry descriptors.
**Notes:** Alpha Vantage is implemented in this phase. Twelve Data can be represented as planned/disabled metadata, but fetch behavior waits for Phase 4.

---

## API Key CRUD

| Option | Description | Selected |
| --- | --- | --- |
| One saved key per provider | Fits single-admin v1 and keeps CRUD understandable. | yes |
| Multiple named keys per provider | More flexible for teams or rotation, but unnecessary for v1. | |
| Environment keys only | Preserves current behavior but misses the API-key CRUD requirement. | |

**User's choice:** Accept recommended one saved key per provider.
**Notes:** Lists and detail views should show only safe metadata: provider, enabled status, masked suffix, validation status, and timestamps.

---

## Secret Storage

| Option | Description | Selected |
| --- | --- | --- |
| PostgreSQL plus app-level AES-GCM encryption | Uses existing stack and standard library crypto for single-admin at-rest protection. | yes |
| Plaintext DB storage | Simpler but unacceptable for persisted provider secrets. | |
| Hosted secret manager | Stronger operational model but too heavy for this milestone. | |

**User's choice:** Accept recommended PostgreSQL plus app-level encryption.
**Notes:** Use `PROVIDER_KEYS_ENCRYPTION_SECRET`, fail closed for saved-key operations when missing, and keep `ALPHA_VANTAGE_API_KEY` as read-only migration fallback.

---

## Key Validation

| Option | Description | Selected |
| --- | --- | --- |
| Explicit validation button | Avoids quota use on page load and lets the admin control provider checks. | yes |
| Auto-validate on page load | Looks convenient but burns quota and creates noisy provider calls. | |
| Validate only during fetch | Keeps settings simple but gives poor provider readiness feedback. | |

**User's choice:** Accept recommended explicit validation action.
**Notes:** Validation should run a minimal provider check, record sanitized status, and never expose raw keys, URLs, or unsanitized provider bodies.

---

## Sample Data Gate

| Option | Description | Selected |
| --- | --- | --- |
| Explicit demo/development gate | Keeps sample useful while preventing silent fallback in real-data flows. | yes |
| Leave sample visible as a normal source | Preserves current convenience but can undermine real-data trust. | |
| Remove sample entirely | Reduces ambiguity but loses useful local demo/test behavior. | |

**User's choice:** Accept recommended explicit sample gate.
**Notes:** Normal backtest and fetch flows should not silently use sample data.

---

## UI Polish

| Option | Description | Selected |
| --- | --- | --- |
| Reuse current primitives plus restrained Magic UI status cards | Keeps the interface consistent while allowing subtle provider-status polish. | yes |
| Full shadcn/Magic UI setup | Larger visual and dependency change than Phase 1 needs. | |
| No Magic UI consideration in Phase 1 | Safest technically but misses the user's request to start using Magic UI where sensible. | |

**User's choice:** Accept recommended restrained UI approach.
**Notes:** Use existing `PageHeader`, `DataTable`, `StatCard`, and `EmptyState` first. Copy/adapt Magic UI only where it clarifies provider readiness or validation state.

---

## Phase Scope

| Option | Description | Selected |
| --- | --- | --- |
| Store settings and secrets foundation only | Matches Phase 1 success criteria and unblocks later data workflows. | yes |
| Include full missing-data fetch lifecycle now | Important capability, but belongs to Phase 3 after settings and provenance. | |
| Include second provider implementation now | Useful, but Twelve Data adapter belongs to Phase 4 after settings/provenance. | |

**User's choice:** Accept recommended Phase 1 boundary.
**Notes:** Phase 1 stores knobs that later phases consume. It should not implement broker integrations, CSV import, volatility metrics, or chart source labels.

---

## the agent's Discretion

- Exact page composition, labels, field grouping, and route-handler structure.
- Exact validation ticker/range, as long as it is stable, minimal, and injectable in tests.
- Whether provider key CRUD uses inline forms, modals, or simple page sections.
- Whether Magic UI is included in Phase 1 or deferred if setup churn is disproportionate.

## Deferred Ideas

- Phase 3: Backtest preflight, confirm-and-fetch flow, visible silent-fetch progress, quota handling, and request dedupe.
- Phase 4: Twelve Data adapter and key validation behavior.
- Phase 5: CSV import and custom data source path.
- Phase 6: Volatility metrics and metric correctness.
- Phase 7: Chart source labels, data dashboard scanability, and broader Magic UI polish.
- Future milestone: Broker API integrations, real orders, real P/L, and order markers on charts.
