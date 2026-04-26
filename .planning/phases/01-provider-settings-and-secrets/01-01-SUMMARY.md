---
phase: 01-provider-settings-and-secrets
plan: 01
subsystem: settings-database
tags: [settings, provider-registry, provider-keys, drizzle, postgres, zod]
requires: []
provides:
  - Settings domain defaults and parser for provider/default fetch behavior.
  - Provider descriptor registry for alpha_vantage, sample, and twelve_data.
  - Safe provider API key metadata types.
  - app_settings and provider_api_keys Drizzle schema definitions.
  - Reviewed migration for provider settings and encrypted key storage tables.
affects: [phase-01-plan-02, phase-01-plan-03, phase-01-plan-04, settings-ui, market-data-provider-resolution]
tech-stack:
  added: []
  patterns:
    - Zod boundary parser returning ok true/false result unions.
    - Safe shared metadata type separate from encrypted server storage columns.
    - Text provider ids in settings/key storage to avoid adapter-coupled enum churn.
key-files:
  created:
    - src/modules/settings/domain/app-settings.ts
    - src/modules/settings/domain/provider-registry.ts
    - src/modules/settings/domain/provider-api-key.ts
    - test/settings/app-settings.test.ts
    - test/settings/provider-registry.test.ts
    - src/modules/db/migrations/0002_provider_settings_and_secrets.sql
    - src/modules/db/migrations/meta/0002_snapshot.json
  modified:
    - src/modules/db/schema.ts
    - src/modules/db/migrations/meta/_journal.json
key-decisions:
  - "Only alpha_vantage is selectable as the default provider in Phase 1; sample is gated by showSampleData and twelve_data remains planned."
  - "ProviderApiKeyMetadata exposes safe browser metadata only; encrypted material stays in database/server storage columns."
  - "Provider ids are stored as text in the new tables so planned provider descriptors do not force enum migrations."
patterns-established:
  - "Settings parsers use selectableDefaultProviderIds, not all providerIds, to keep non-runnable defaults unrepresentable."
  - "Provider descriptors centralize status, key requirements, supported intervals, and safe descriptions."
requirements-completed: [SET-02, SET-03, SET-04, KEY-01, KEY-02, KEY-03]
generated_by: gsd-execute-plan
lifecycle_mode: interactive
phase_lifecycle_id: 01-2026-04-26T16-55-02
generated_at: 2026-04-26T18:22:16Z
duration: 5 min 55s
completed: 2026-04-26
---

# Phase 01 Plan 01: Settings Contracts, Schema, and Migration Summary

**Provider settings and safe key-storage foundation with real-data-first defaults and reviewed Drizzle migration**

## Performance

- **Duration:** 5 min 55s
- **Started:** 2026-04-26T18:16:21Z
- **Completed:** 2026-04-26T18:22:16Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added settings defaults and parser that allow `alpha_vantage` as the only Phase 1 default provider while rejecting `sample` and `twelve_data`.
- Added provider descriptors for Alpha Vantage, gated sample data, and planned Twelve Data without adding adapter behavior.
- Added safe provider key metadata types that exclude plaintext and encrypted storage fields.
- Added `app_settings` and `provider_api_keys` schema with encrypted material columns, safe metadata columns, and one key per provider.
- Added reviewed `0002_provider_settings_and_secrets` migration with the singleton app settings seed row.

## Task Commits

1. **Task 1 RED: Settings domain contract tests** - `7126c62` (test)
2. **Task 1 GREEN: Settings domain contracts** - `4e019df` (feat)
3. **Task 2 RED: Settings schema tests** - `f1bc6e4` (test)
4. **Task 2 GREEN: Settings/key schema** - `8c15ac4` (feat)
5. **Task 3: Provider settings migration** - `5557af8` (feat)

## Files Created/Modified

- `src/modules/settings/domain/app-settings.ts` - App settings constants, types, defaults, selectable-provider guard, and Zod parser.
- `src/modules/settings/domain/provider-registry.ts` - Provider descriptors and key-manageable provider helpers.
- `src/modules/settings/domain/provider-api-key.ts` - Safe provider key metadata and validation status types.
- `src/modules/db/schema.ts` - `app_settings` and `provider_api_keys` Drizzle table definitions.
- `src/modules/db/migrations/0002_provider_settings_and_secrets.sql` - Reviewed SQL for new settings/key tables and singleton settings seed row.
- `src/modules/db/migrations/meta/_journal.json` - Drizzle journal entry for migration idx 2.
- `src/modules/db/migrations/meta/0002_snapshot.json` - Drizzle schema snapshot after the new tables.
- `test/settings/app-settings.test.ts` - Settings parser/default/schema and safe metadata tests.
- `test/settings/provider-registry.test.ts` - Provider descriptor capability tests.

## Decisions Made

- Only `alpha_vantage` is selectable as `defaultProvider` in this plan because it is the only runnable real provider.
- `sample` remains registry-visible but is controlled by `showSampleData`, not by the default provider setting.
- `twelve_data` is represented as planned metadata only; no adapter or runtime behavior was added.
- Provider key metadata stays safe for shared/browser use and excludes plaintext, ciphertext, IV, and auth-tag fields.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Narrowed generated migration to actual new tables**
- **Found during:** Task 3 (Generate and review Drizzle migration)
- **Issue:** `drizzle-kit generate` produced SQL for the full current schema because earlier hand-written migrations did not have matching snapshots. That migration would attempt to recreate existing enums/tables and did not include the required singleton seed row.
- **Fix:** Renamed the generated migration, updated the journal tag, narrowed the SQL to `app_settings` and `provider_api_keys`, and added the required seed row.
- **Files modified:** `src/modules/db/migrations/0002_provider_settings_and_secrets.sql`, `src/modules/db/migrations/meta/_journal.json`
- **Verification:** `bun run db:generate` reported no schema changes; SQL/journal acceptance greps passed.
- **Committed in:** `5557af8`

---

**Total deviations:** 1 auto-fixed (Rule 1: 1)
**Impact on plan:** Migration correctness improved without changing the planned schema or downstream contracts.

## Issues Encountered

- `DATABASE_URL` was not configured, so migration application was not run locally.
- `next build` rewrote tracked `next-env.d.ts` during verification; the generated route-type churn was restored before commits so no unrelated change remained.
- The secret-scan grep matches the required nonsecret journal tag `0002_provider_settings_and_secrets`; no provider key values, environment fallback names, ciphertext examples, IV examples, or auth-tag examples are present.

## User Setup Required

None - no external service configuration required by this plan.

## Known Stubs

None.

## Threat Flags

None - the new `app_settings` and `provider_api_keys` trust-boundary surfaces were covered by the plan threat model.

## Verification

- `bun run test -- test/settings/app-settings.test.ts test/settings/provider-registry.test.ts` passed.
- `bun run typecheck` passed.
- `bun run db:generate` generated the migration and later reported no schema drift.
- `bun run verify` passed after Tasks 1 and 2.
- Migration acceptance greps passed for both new tables, provider uniqueness, journal tag, and singleton seed row.

## Next Phase Readiness

Ready for Plan 01-02 to add server-only encrypted provider key storage and CRUD services on top of these contracts and tables.

## Self-Check: PASSED

- Verified created and modified files exist.
- Verified task commits `7126c62`, `4e019df`, `f1bc6e4`, `8c15ac4`, and `5557af8` exist.

---
*Phase: 01-provider-settings-and-secrets*
*Completed: 2026-04-26*
