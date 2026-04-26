---
phase: 01-provider-settings-and-secrets
plan: 03
subsystem: settings-api
tags: [settings, provider-keys, api-routes, credential-resolution, validation, vitest]
requires:
  - phase: 01-provider-settings-and-secrets
    plan: 01
    provides: Settings contracts, provider registry, safe key metadata types, and settings/key database tables.
  - phase: 01-provider-settings-and-secrets
    plan: 02
    provides: Server-only encrypted provider-key storage, repositories, settings service, provider-key service, and singleton accessors.
provides:
  - Explicit Alpha Vantage provider-key validation with sanitized status codes.
  - Persisted-key-first provider credential resolution with ALPHA_VANTAGE_API_KEY fallback.
  - Settings and provider-key API routes returning only safe DTOs.
  - Contract tests for provider-key validation, credential resolution, and settings/provider-key routes.
affects: [phase-01-plan-04, settings-ui, market-data-provider-resolution, provider-key-crud]
tech-stack:
  added: []
  patterns:
    - Server-only validation and resolver services accept repository, crypto, fetch, env, and clock dependencies for deterministic tests.
    - API routes keep boundary JSON parsing thin and delegate provider/settings validation to services.
    - Provider validation stores safe message codes instead of raw provider messages.
key-files:
  created:
    - src/modules/settings/server/provider-error-sanitizer.ts
    - src/modules/settings/server/provider-key-validation-service.ts
    - src/modules/settings/server/provider-credential-resolver.ts
    - src/app/api/settings/route.ts
    - src/app/api/settings/provider-keys/route.ts
    - src/app/api/settings/provider-keys/[providerId]/route.ts
    - src/app/api/settings/provider-keys/[providerId]/validate/route.ts
    - test/settings/provider-key-validation-service.test.ts
    - test/settings/provider-credential-resolver.test.ts
    - test/settings/settings-api-contract.test.ts
  modified:
    - src/modules/settings/server/service-singleton.ts
key-decisions:
  - "Provider validation persists safe code strings such as provider_key_validated, provider_rejected_key, provider_rate_limited, provider_unavailable, malformed_provider_response, and missing_provider_key."
  - "Credential resolution fails closed when an enabled saved key cannot be decrypted instead of falling through to the environment fallback."
  - "Provider-key create/replacement routes default enabled to true when the request omits enabled, matching the simple single-admin create contract."
patterns-established:
  - "Settings API responses include environment fallback configured booleans only, never fallback values."
  - "Route contract tests dynamically assert unsafe secret/storage field names are absent without placing those names in route-response fixtures."
requirements-completed: [SET-02, SET-03, SET-04, KEY-01, KEY-02, KEY-03, KEY-04, KEY-05]
generated_by: gsd-execute-plan
lifecycle_mode: interactive
phase_lifecycle_id: 01-2026-04-26T16-55-02
generated_at: 2026-04-26T18:46:04Z
duration: 9 min 10s
completed: 2026-04-26
---

# Phase 01 Plan 03: Provider Validation, Credential Resolution, and API Routes Summary

**Sanitized provider-key validation, persisted-key-first credential resolution, and safe settings/provider-key JSON API contracts**

## Performance

- **Duration:** 9 min 10s
- **Started:** 2026-04-26T18:36:54Z
- **Completed:** 2026-04-26T18:46:04Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added explicit Alpha Vantage saved-key validation that decrypts server-side, performs one injectable `TIME_SERIES_DAILY` check against `IBM`, stores timestamped validation metadata, and returns safe metadata only.
- Added provider error sanitization so raw provider URLs, `apikey=` values, plaintext keys, and raw response bodies are not stored or returned.
- Added credential resolution that prefers enabled persisted Alpha Vantage keys and preserves the read-only `ALPHA_VANTAGE_API_KEY` fallback only when no enabled saved key resolves.
- Added settings and provider-key API routes for settings read/update, key metadata list/create/update/delete, and explicit validation.
- Added focused contract tests proving unsupported provider gates, safe DTOs, fallback configured booleans, and no plaintext/encrypted material in API responses.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Provider key validation tests** - `991626b` (test)
2. **Task 1 GREEN: Provider key validation service** - `270fecd` (feat)
3. **Task 2 RED: Credential resolver tests** - `0a12b24` (test)
4. **Task 2 GREEN: Credential resolver** - `dd06370` (feat)
5. **Task 3 RED: Settings API contract tests** - `bd5f5f3` (test)
6. **Task 3 GREEN: Settings/provider-key API routes** - `7534bc0` (feat)

## Files Created/Modified

- `src/modules/settings/server/provider-error-sanitizer.ts` - Sanitizes provider validation outcomes into safe message codes and fixed user-facing messages.
- `src/modules/settings/server/provider-key-validation-service.ts` - Explicit saved-key validation service with injectable decrypt, fetch, repository, and clock dependencies.
- `src/modules/settings/server/provider-credential-resolver.ts` - Server-only persisted-key-first Alpha Vantage credential resolver.
- `src/modules/settings/server/service-singleton.ts` - Adds cached validation-service and credential-resolver accessors.
- `src/app/api/settings/route.ts` - GET/PUT settings API returning settings, provider descriptors, safe key metadata, selectable defaults, and fallback configured booleans.
- `src/app/api/settings/provider-keys/route.ts` - GET/POST provider-key metadata and create API.
- `src/app/api/settings/provider-keys/[providerId]/route.ts` - PUT/DELETE provider-key replacement, enabled toggle, and delete API.
- `src/app/api/settings/provider-keys/[providerId]/validate/route.ts` - POST explicit provider-key validation API.
- `test/settings/provider-key-validation-service.test.ts` - Validation behavior, sanitization, unsupported-provider, and fail-closed tests.
- `test/settings/provider-credential-resolver.test.ts` - Persisted precedence, disabled-key, fallback, missing, and decrypt-failure tests.
- `test/settings/settings-api-contract.test.ts` - Route contract tests for settings/key DTO safety and provider gates.

## Decisions Made

- Validation messages are stored as stable safe codes rather than provider-authored text.
- Missing encryption secret or decrypt failure on an enabled saved key is treated as a saved-key failure and does not fall through to a fallback key.
- API route responses wrap successful provider-key metadata as `providerKey` or `providerKeys`, keeping service internals out of client contracts.
- Unsupported `sample` and `twelve_data` provider-key operations are allowed to flow through the existing service gates for known provider ids, while unknown provider ids return a safe 404.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The repo references pinned Bright Builds canonical standards under `standards/`, but those files are not present in this checkout. Local `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`, and embedded codebase conventions were used.
- `next build` rewrote tracked `next-env.d.ts` from dev route types to production route types during `bun run verify`; the generated churn was restored before commits so no unrelated change remained.
- Stub scan matched only intentional test fixture defaults, dependency defaults, and nullable singleton caches; no UI placeholders or unwired data sources were introduced.

## User Setup Required

Live saved-key validation and persisted-key credential resolution require the existing Phase 1 setup:

- `PROVIDER_KEYS_ENCRYPTION_SECRET` for decrypting saved provider keys.
- `ALPHA_VANTAGE_API_KEY` remains an optional read-only fallback when no enabled saved key resolves.

## Known Stubs

None.

## Threat Flags

None - the new validation service, credential resolver, and settings/provider-key API route trust boundaries were covered by the plan threat model.

## Verification

- `bun run test -- test/settings/provider-key-validation-service.test.ts` failed in RED before the validation service existed, then passed after implementation.
- `bun run test -- test/settings/provider-credential-resolver.test.ts` failed in RED before the resolver existed, then passed after implementation.
- `bun run test -- test/settings/settings-api-contract.test.ts` failed in RED before the settings API routes existed, then passed after implementation.
- `bun run test -- test/settings/provider-key-validation-service.test.ts test/settings/provider-credential-resolver.test.ts test/settings/settings-api-contract.test.ts` passed with 20 tests.
- `bun run typecheck` passed.
- `bun run verify` passed after Task 1, Task 2, and Task 3 implementation commits.
- Acceptance greps passed for validation behavior, unsupported-provider coverage, resolver behavior, route method exports, absence of encrypted-material field names in settings route/test files, and provider gate contract coverage.

## Next Phase Readiness

Ready for Plan 01-04 to connect the settings UI to these safe API contracts and display provider-key readiness without exposing secret material.

## Self-Check: PASSED

- Verified `01-03-SUMMARY.md` exists.
- Verified all created source and test files exist.
- Verified task commits `991626b`, `270fecd`, `0a12b24`, `dd06370`, `bd5f5f3`, and `7534bc0` exist.
- Verified `.planning/STATE.md` and `.planning/ROADMAP.md` were not modified.

---
*Phase: 01-provider-settings-and-secrets*
*Completed: 2026-04-26*
