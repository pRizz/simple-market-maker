---
phase: 01-provider-settings-and-secrets
plan: 04
subsystem: market-data-provider-resolution
tags: [market-data, settings, provider-credentials, alpha-vantage, sample-gate, vitest]
requires:
  - phase: 01-provider-settings-and-secrets
    plan: 01
    provides: Settings contracts, provider registry, and provider/key database schema.
  - phase: 01-provider-settings-and-secrets
    plan: 02
    provides: Server-only settings and encrypted provider-key services.
  - phase: 01-provider-settings-and-secrets
    plan: 03
    provides: Provider credential resolver, provider-error sanitizer, and safe settings API contracts.
provides:
  - Async market-data provider factory that resolves Alpha Vantage credentials through the settings resolver.
  - Persisted-key-first Alpha Vantage provider construction with environment fallback only through the resolver.
  - Server-side sample-data creation gate using showSampleData before provider construction.
  - Sanitized market-data provider fetch failures for form errors.
  - Focused provider factory and market-data service tests for credential precedence, sample gating, and sanitization.
affects: [settings-ui, market-data-fetch-flow, backtest-missing-data-fetch, phase-01-plan-05]
tech-stack:
  added: []
  patterns:
    - Async provider factory dependencies keep credential resolution and fetch injection testable.
    - Market-data service parses input before loading settings or constructing providers.
    - Provider failures are converted to safe sanitizer messages at the service boundary.
key-files:
  created:
    - test/market-data/provider-factory.test.ts
    - test/market-data/market-data-service.test.ts
  modified:
    - src/modules/market-data/server/provider-factory.ts
    - src/modules/market-data/server/market-data-service.ts
    - src/modules/market-data/server/alpha-vantage-market-data-provider.ts
key-decisions:
  - "Alpha Vantage provider construction now gets credentials only from resolveProviderCredential; provider-factory.ts no longer reads ALPHA_VANTAGE_API_KEY directly."
  - "Missing Alpha Vantage credentials are represented as a safe provider failure so market-data service sanitization owns the browser-facing error."
  - "Sample market-data creation is rejected server-side when showSampleData is false, before provider construction."
patterns-established:
  - "Provider factory tests inject credential resolver and fetch dependencies rather than using live provider calls."
  - "Market-data service tests use repository, provider, and settings fakes to prove boundary behavior without a database."
requirements-completed: [SET-02, SET-04, KEY-02, KEY-04, KEY-05]
generated_by: gsd-execute-plan
lifecycle_mode: interactive
phase_lifecycle_id: 01-2026-04-26T16-55-02
generated_at: 2026-04-26T18:54:39Z
duration: 5 min 55s
completed: 2026-04-26
---

# Phase 01 Plan 04: Provider Settings Integration Summary

**Persisted-key-first Alpha Vantage provider creation with server-side sample gating and sanitized market-data fetch errors**

## Performance

- **Duration:** 5 min 55s
- **Started:** 2026-04-26T18:48:44Z
- **Completed:** 2026-04-26T18:54:39Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Made market-data provider construction async and resolver-backed so saved enabled Alpha Vantage keys take precedence over the environment fallback.
- Added server-side `showSampleData` enforcement before sample provider construction so API callers cannot bypass the UI gate.
- Sanitized provider fetch failures before returning `formErrors`, preventing raw provider URLs, `apikey=`, raw keys, or raw response bodies from reaching forms.
- Added focused Vitest coverage for provider credential precedence, missing-key behavior, sample gating, async provider creation, sanitization, and validation short-circuiting.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Provider credential factory tests** - `83a32f9` (test)
2. **Task 1 GREEN: Resolver-backed provider factory** - `1ce4afc` (feat)
3. **Task 2 RED: Market-data service gate tests** - `94c80c6` (test)
4. **Task 2 GREEN: Sample gate and sanitized errors** - `67aa33f` (feat)
5. **Task 3: Focused integration verification** - `15f19e6` (chore)

## Files Created/Modified

- `src/modules/market-data/server/provider-factory.ts` - Async provider factory with injectable credential resolver/fetch dependencies and explicit Alpha Vantage key handoff.
- `src/modules/market-data/server/market-data-service.ts` - Async provider creation, server-side sample visibility gate, settings service dependency, and provider-error sanitization.
- `src/modules/market-data/server/alpha-vantage-market-data-provider.ts` - Safe missing-key message for provider fetch failures.
- `test/market-data/provider-factory.test.ts` - Credential precedence, sample-provider, environment fallback, and missing-key provider tests.
- `test/market-data/market-data-service.test.ts` - Sample gate, async provider, sanitized error, and validation short-circuit tests.

## Decisions Made

- The provider factory does not read `process.env.ALPHA_VANTAGE_API_KEY`; environment fallback remains centralized in the Plan 03 credential resolver.
- A missing resolver result returns a provider that fails safely on fetch rather than leaking resolver details to UI/API layers.
- Existing Plan 03 sanitizer messages were reused for market-data fetch failures, even when the safe fallback wording mentions validation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Awaited async provider factories in the service during Task 1**
- **Found during:** Task 1 (Make provider factory resolve saved credentials first)
- **Issue:** Changing `providerForSource` to return `Promise<MarketDataFetchProvider>` made `market-data-service.ts` fail typecheck because it still treated provider creation as synchronous.
- **Fix:** Updated the market-data service dependency type and awaited `makeProvider(...)`; Task 2 then completed the planned sample gate and sanitizer wiring in the same file.
- **Files modified:** `src/modules/market-data/server/market-data-service.ts`
- **Verification:** `bun run typecheck` passed after the fix; focused provider tests still passed.
- **Committed in:** `1ce4afc`

---

**Total deviations:** 1 auto-fixed (Rule 3: 1)
**Impact on plan:** The fix kept the async provider-factory contract type-safe without expanding product scope.

## Issues Encountered

- `next build` rewrote tracked `next-env.d.ts` from dev route types to production route types during `bun run verify`; the generated churn was restored before commits so no unrelated change remained.
- The Task 2 sanitizer test initially expected the rejected-key message, but the existing Plan 03 sanitizer maps the redacted URL/key failure to the safe provider-unavailable message. The test was corrected to assert the actual safe message and absence of raw URL/key details.
- Stub scan matched only intentional dependency/test defaults such as empty fake arrays, empty option objects, and null-returning fakes; no UI placeholder or unwired data source was introduced.

## User Setup Required

None new. Live Alpha Vantage fetches still require either an enabled saved key from the settings flow or the existing `ALPHA_VANTAGE_API_KEY` environment fallback.

## Known Stubs

None.

## Threat Flags

None - the credential handoff, sample source boundary, and provider error boundary were covered by the plan threat model.

## Verification

- `bun run test -- test/market-data/provider-factory.test.ts test/market-data/alpha-vantage-market-data-provider.test.ts` failed in RED before resolver-backed construction, then passed after Task 1 GREEN.
- `bun run test -- test/market-data/market-data-service.test.ts` failed in RED before the sample gate and sanitizer, then passed after Task 2 GREEN.
- `bun run test -- test/market-data/provider-factory.test.ts test/market-data/market-data-service.test.ts test/market-data/alpha-vantage-market-data-provider.test.ts` passed with 15 tests.
- `bun run typecheck` passed.
- `bun run lint` passed.
- `bun run verify` passed with 78 tests and a production Next build.
- Acceptance greps passed for resolver usage, explicit Alpha Vantage key construction, sample gate/sanitizer wiring, no new Twelve Data provider implementation, and no direct `process.env.ALPHA_VANTAGE_API_KEY` read in `provider-factory.ts`.

## Next Phase Readiness

Ready for Plan 01-05 to document deployment risks and setup expectations. Market-data fetch creation now consumes the settings credential resolver and sample visibility setting without live external provider calls in tests.

## Self-Check: PASSED

- Verified `01-04-SUMMARY.md` exists.
- Verified created and modified source/test files exist.
- Verified task commits `83a32f9`, `1ce4afc`, `94c80c6`, `67aa33f`, and `15f19e6` exist.
- Verified `.planning/STATE.md` and `.planning/ROADMAP.md` were not modified.

---
*Phase: 01-provider-settings-and-secrets*
*Completed: 2026-04-26*
