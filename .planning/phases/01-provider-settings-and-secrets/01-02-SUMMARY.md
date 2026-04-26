---
phase: 01-provider-settings-and-secrets
plan: 02
subsystem: settings-secrets
tags: [settings, provider-keys, aes-gcm, drizzle, server-only, vitest]
requires:
  - phase: 01-provider-settings-and-secrets
    plan: 01
    provides: Settings domain contracts, provider registry, safe key metadata types, and settings/key database tables.
provides:
  - AES-256-GCM provider-key encryption and decryption helper backed by PROVIDER_KEYS_ENCRYPTION_SECRET.
  - Server-only repositories for singleton app settings and one saved key per provider.
  - Settings service for parser-backed default-provider, missing-data behavior, and sample-visibility updates.
  - Provider API key service for metadata-only create, update, list, disable, and delete flows.
  - Cached settings/provider-key service singleton accessors.
affects: [phase-01-plan-03, phase-01-plan-04, settings-ui, market-data-provider-resolution]
tech-stack:
  added: []
  patterns:
    - Server-only AES-GCM helper returns typed safe result unions instead of throwing raw crypto errors.
    - Repositories map text-backed Drizzle rows into domain records at the server boundary.
    - Provider key service gates Phase 1 CRUD through isKeyManageableProviderId before encryption or persistence.
key-files:
  created:
    - src/modules/settings/server/provider-key-encryption.ts
    - src/modules/settings/server/app-settings-repository.ts
    - src/modules/settings/server/provider-api-key-repository.ts
    - src/modules/settings/server/settings-service.ts
    - src/modules/settings/server/provider-api-key-service.ts
    - src/modules/settings/server/service-singleton.ts
    - test/settings/provider-key-encryption.test.ts
    - test/settings/settings-service.test.ts
    - test/settings/provider-api-key-service.test.ts
    - .planning/phases/01-provider-settings-and-secrets/01-02-USER-SETUP.md
  modified: []
key-decisions:
  - "Provider key encryption accepts only PROVIDER_KEYS_ENCRYPTION_SECRET, requires at least 32 trimmed UTF-8 bytes, and derives the AES-256 key with SHA-256."
  - "Provider key CRUD rejects sample and twelve_data through isKeyManageableProviderId before encryption, repository writes, enable updates, or deletes."
  - "Provider key service returns ProviderApiKeyMetadata only; plaintext, ciphertext, IV, and auth tag stay in server-only storage paths."
  - "Saved provider key metadata stores and returns a masked suffix shaped as **** plus the last visible API-key characters."
patterns-established:
  - "TDD RED/GREEN commits for server-side settings behavior."
  - "Settings services accept unknown/raw input at the boundary, parse to domain values, and return ok true/false result unions."
  - "Repository-injected services keep database and encryption effects testable with in-memory fakes."
requirements-completed: [SET-02, SET-03, SET-04, KEY-01, KEY-02, KEY-03]
generated_by: gsd-execute-plan
lifecycle_mode: interactive
phase_lifecycle_id: 01-2026-04-26T16-55-02
generated_at: 2026-04-26T18:34:13Z
duration: 8 min 24s
completed: 2026-04-26
---

# Phase 01 Plan 02: Provider Settings and Secrets Services Summary

**Server-only settings and encrypted provider-key CRUD services with AES-GCM storage and metadata-only responses**

## Performance

- **Duration:** 8 min 24s
- **Started:** 2026-04-26T18:25:49Z
- **Completed:** 2026-04-26T18:34:13Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added AES-256-GCM provider-key encryption/decryption with fail-closed handling for missing, short, or tampered secret material.
- Added Drizzle repositories for singleton app settings and provider API key rows with one saved key per provider.
- Added settings and provider-key services that parse raw input, reject unsupported provider key CRUD before side effects, and return only safe metadata.
- Added service singleton accessors for later API routes, UI pages, and provider resolution.
- Added focused Vitest coverage for encryption, settings updates, provider-key replacement, unsupported-provider gates, disable/delete behavior, and metadata safety.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Provider key encryption tests** - `9fa08af` (test)
2. **Task 1 GREEN: Provider key encryption helper** - `f4720c0` (feat)
3. **Task 2: Settings and provider-key repositories** - `1bc057f` (feat)
4. **Task 3 RED: Settings service tests** - `c619bd7` (test)
5. **Task 3 GREEN: Settings and provider-key services** - `bc03eeb` (feat)

## Files Created/Modified

- `src/modules/settings/server/provider-key-encryption.ts` - Server-only AES-256-GCM helper with typed encryption/decryption results.
- `src/modules/settings/server/app-settings-repository.ts` - Singleton app settings repository with default creation and parser-backed row mapping.
- `src/modules/settings/server/provider-api-key-repository.ts` - Provider API key repository with encrypted row mapping, provider-id upsert, enable updates, validation metadata updates, and delete.
- `src/modules/settings/server/settings-service.ts` - Settings read/update service using domain parsing and result unions.
- `src/modules/settings/server/provider-api-key-service.ts` - Provider key CRUD service with key-management gates, encryption, safe metadata mapping, and masked suffixes.
- `src/modules/settings/server/service-singleton.ts` - Cached server-only settings and provider-key service accessors.
- `test/settings/provider-key-encryption.test.ts` - Encryption/decryption and fail-closed crypto behavior tests.
- `test/settings/settings-service.test.ts` - Settings defaults, accepted updates, and default-provider rejection tests.
- `test/settings/provider-api-key-service.test.ts` - Provider-key CRUD, replacement, unsupported-provider, disable/delete, and safe metadata tests.
- `.planning/phases/01-provider-settings-and-secrets/01-02-USER-SETUP.md` - Required local/deployment secret setup note.

## Decisions Made

- Used `PROVIDER_KEYS_ENCRYPTION_SECRET` as the only encryption-secret source; public env names and provider fallback keys are intentionally not read by the encryption helper.
- Required at least 32 trimmed UTF-8 bytes for the encryption secret, then derived the AES-256 key with SHA-256.
- Kept encrypted provider-key fields in server-only repository records and mapped all service responses to `ProviderApiKeyMetadata`.
- Used `isKeyManageableProviderId` as the Phase 1 CRUD gate so `sample` and `twelve_data` never reach encryption or repository mutation paths.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Parsed text-backed settings rows before domain mapping**
- **Found during:** Task 2 (Add settings and provider-key repositories)
- **Issue:** `app_settings` stores provider and behavior columns as text, so direct row mapping failed TypeScript literal checks for `DefaultProviderId` and `MissingDataBehavior`.
- **Fix:** Passed raw row values through `maybeParseAppSettingsInput` at the repository boundary and throw on invalid persisted settings.
- **Files modified:** `src/modules/settings/server/app-settings-repository.ts`
- **Verification:** `bun run typecheck` passed, followed by full `bun run verify`.
- **Committed in:** `1bc057f`

---

**Total deviations:** 1 auto-fixed (Rule 3: 1)
**Impact on plan:** The fix kept text-backed storage compatible with strict domain settings and did not expand scope.

## Issues Encountered

- `next build` rewrote tracked `next-env.d.ts` from dev route types to production route types during each `bun run verify`; the generated change was restored before commits so no unrelated file churn remained.
- The stub scan matched intentional nullable/default/test fixture shapes such as `= null`, `= {}`, and empty test arrays; none are placeholder data sources or UI stubs.

## User Setup Required

External configuration is required for saved provider-key create, update, and decrypt paths. See [01-02-USER-SETUP.md](./01-02-USER-SETUP.md) for `PROVIDER_KEYS_ENCRYPTION_SECRET` setup and verification.

## Known Stubs

None.

## Threat Flags

None - the new encryption helper, provider-key repository/service, settings repository/service, and metadata response surfaces were covered by the plan threat model.

## Verification

- `bun run test -- test/settings/provider-key-encryption.test.ts` failed in RED before the helper existed, then passed after implementation.
- `bun run test -- test/settings/provider-key-encryption.test.ts` passed after Task 1 GREEN.
- `bun run typecheck` passed after Task 2.
- `bun run test -- test/settings/provider-key-encryption.test.ts test/settings/settings-service.test.ts test/settings/provider-api-key-service.test.ts` failed in RED before service modules existed, then passed after implementation.
- `bun run typecheck` passed after Task 3.
- `bun run verify` passed after Task 1 GREEN, Task 2, and Task 3 GREEN.
- Acceptance greps passed for AES-GCM usage, no public/provider env references in encryption, repository methods, service APIs, unsupported-provider coverage, and absence of encrypted-material names in provider-key service responses.

## Next Phase Readiness

Ready for Plan 01-03 to add provider-key validation and credential resolution on top of the encrypted storage and metadata-only service layer.

## Self-Check: PASSED

- Verified created files exist.
- Verified task commits `9fa08af`, `f4720c0`, `1bc057f`, `c619bd7`, and `bc03eeb` exist.
- Verified `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/REQUIREMENTS.md` were not modified.

---
*Phase: 01-provider-settings-and-secrets*
*Completed: 2026-04-26*
