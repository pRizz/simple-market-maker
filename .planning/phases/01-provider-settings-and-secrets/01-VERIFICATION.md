---
phase: 01-provider-settings-and-secrets
verified: 2026-04-26T19:25:37Z
status: human_needed
score: 10/10 must-haves verified
generated_by: gsd-verifier
lifecycle_mode: interactive
phase_lifecycle_id: 01-2026-04-26T16-55-02
generated_at: 2026-04-26T19:25:37Z
lifecycle_validated: true
overrides_applied: 0
deferred:
  - truth: "Silent-fetch execution with visible backtest progress is not implemented in Phase 1."
    addressed_in: "Phase 3"
    evidence: "Phase 3 success criterion: visible silent-fetch progress when the setting is enabled."
  - truth: "Twelve Data remains planned metadata only."
    addressed_in: "Phase 4"
    evidence: "Phase 4 goal and success criteria own the Twelve Data provider decision and adapter."
  - truth: "Broader sample-data labeling across market-data provenance views is outside Phase 1."
    addressed_in: "Phase 2"
    evidence: "Phase 2 success criterion: sample data is labeled as an explicit demo/development source."
human_verification:
  - test: "Settings UI workflow"
    expected: "From the dashboard, open /settings, save provider/default-fetch/sample settings, and see the page refresh with the new persisted values."
    why_human: "Browser navigation, visual layout, and end-to-end form ergonomics require UI testing."
  - test: "Provider key live workflow"
    expected: "With PROVIDER_KEYS_ENCRYPTION_SECRET set, save an Alpha Vantage key, validate it, disable/enable it, replace it, and delete it without any raw key value appearing in the browser."
    why_human: "Requires operator-supplied secrets and a live external Alpha Vantage response."
  - test: "Sample visibility semantics"
    expected: "When showSampleData is false, sample data is blocked server-side; verify whether product expects the /market-data/new source option to be hidden or merely rejected on submit."
    why_human: "The code enforces the server gate, but the exact UX expectation for visibility versus availability needs product confirmation."
---

# Phase 1: Provider Settings and Secrets Verification Report

**Phase Goal:** Admin can safely configure market-data providers, default fetch behavior, and sample-data gates before real-data workflows rely on them.
**Verified:** 2026-04-26T19:25:37Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can open a settings page from navigation and set default provider, missing-data behavior, and sample/demo visibility. | VERIFIED | `src/app/page.tsx:102` links to `/settings`; `src/app/settings/page.tsx:51-62` loads settings and provider-key data; `src/components/settings/settings-form.tsx:61-70` submits exact settings fields; `src/components/settings/settings-form.tsx:111-115` limits default providers to selectable ids. |
| 2 | Settings have durable defaults for Alpha Vantage, confirm-before-fetch, and hidden sample data. | VERIFIED | `src/modules/settings/domain/app-settings.ts:20-23` defines defaults; `src/modules/db/schema.ts:38-44` and `src/modules/db/migrations/0002_provider_settings_and_secrets.sql:1-10` persist matching defaults and seed the singleton row. |
| 3 | Default-provider parsing rejects sample and Twelve Data until they are runnable real providers. | VERIFIED | Parser uses `z.enum(selectableDefaultProviderIds)` at `src/modules/settings/domain/app-settings.ts:35`; tests cover `sample` and `twelve_data` rejection in `test/settings/app-settings.test.ts:43-73` and API rejection in `test/settings/settings-api-contract.test.ts:299-318`. |
| 4 | Provider descriptors expose safe registry metadata for Alpha Vantage, sample, and Twelve Data. | VERIFIED | `src/modules/settings/domain/provider-registry.ts:19-58` defines descriptors, fallback env name, statuses, intervals, selectable/default flags, and key-manageable ids with only `alpha_vantage` key-manageable. |
| 5 | Provider API keys are stored server-side as sensitive values and browser/service responses expose metadata only. | VERIFIED | DB columns store encrypted key, IV, auth tag, masked suffix, enabled state, validation metadata, and timestamps at `src/modules/db/schema.ts:53-69`; shared `ProviderApiKeyMetadata` excludes plaintext/ciphertext fields at `src/modules/settings/domain/provider-api-key.ts:12-22`; service mapping returns only metadata at `src/modules/settings/server/provider-api-key-service.ts:120-133`. |
| 6 | Admin can create, view, update, disable, and delete keys only for implemented key-required providers. | VERIFIED | Provider-key service gates unsupported providers before encryption/mutation at `src/modules/settings/server/provider-api-key-service.ts:158-168` and `:213-224`; repository upserts one row per provider and supports list, enable, validation update, delete at `src/modules/settings/server/provider-api-key-repository.ts:84-176`; UI renders mutation controls only for key-manageable providers at `src/components/settings/provider-key-form.tsx:247-250`. |
| 7 | Admin can explicitly validate a saved key and receive a sanitized result. | VERIFIED | Validation route calls the validation service at `src/app/api/settings/provider-keys/[providerId]/validate/route.ts:23-49`; validation requires key-manageable provider, enabled saved row, decrypts server-side, calls Alpha Vantage `TIME_SERIES_DAILY` for `IBM`, and stores safe status at `src/modules/settings/server/provider-key-validation-service.ts:195-231`; sanitizer redacts URLs, `apikey=`, raw values, and response bodies at `src/modules/settings/server/provider-error-sanitizer.ts:82-109`. |
| 8 | Provider-backed fetches use enabled saved keys first and still fall back to environment configuration during migration. | VERIFIED | Resolver returns persisted credentials before environment fallback and fails closed on decrypt failure at `src/modules/settings/server/provider-credential-resolver.ts:89-111`; provider factory calls the resolver before constructing Alpha Vantage provider at `src/modules/market-data/server/provider-factory.ts:32-52`; tests cover persisted precedence and fallback in `test/settings/provider-credential-resolver.test.ts:88-170` and `test/market-data/provider-factory.test.ts:79-145`. |
| 9 | Sample data cannot be created through the server create path when hidden, and provider fetch errors are sanitized. | VERIFIED | `src/modules/market-data/server/market-data-service.ts:86-98` checks `showSampleData` before constructing a sample provider; `src/modules/market-data/server/market-data-service.ts:125-127` sanitizes provider errors before returning form errors; tests cover hidden sample rejection and sanitized provider details in `test/market-data/market-data-service.test.ts:94-188`. |
| 10 | Review-fix issues are closed and covered by regression tests. | VERIFIED | `01-REVIEW-FIX.md` fixed short-key masking, server-only Alpha Vantage guard, malformed JSON 400s, and form failure recovery; `01-REVIEW.md` re-reviewed those four findings and reports status `clean` with 27 focused tests passing. |

**Score:** 10/10 truths verified

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Silent-fetch execution with visible backtest progress. | Phase 3 | Phase 3 success criterion requires visible silent-fetch progress. Phase 1 persists the setting only. |
| 2 | Twelve Data as a runnable provider. | Phase 4 | Phase 4 owns the Twelve Data provider decision and adapter. |
| 3 | Broader sample-data labeling in market-data provenance surfaces. | Phase 2 | Phase 2 success criterion requires sample data to be labeled as demo/development source. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/modules/settings/domain/app-settings.ts` | Settings constants, defaults, parser | VERIFIED | Exists, substantive, tested; parser uses selectable defaults. |
| `src/modules/settings/domain/provider-registry.ts` | Provider descriptor registry | VERIFIED | Alpha Vantage implemented/key-manageable; sample demo gated; Twelve Data planned. |
| `src/modules/settings/domain/provider-api-key.ts` | Safe key metadata types | VERIFIED | Metadata excludes plaintext and encrypted storage fields; short suffix masking fixed. |
| `src/modules/db/schema.ts` and `0002_provider_settings_and_secrets.sql` | Settings/key tables and migration | VERIFIED | Singleton settings row, encrypted material columns, safe metadata columns, unique provider id, seed row. |
| `src/modules/settings/server/*` | Server-only encryption, repositories, services, resolver, validation | VERIFIED | AES-GCM helper, fail-closed secret handling, metadata mapping, key-manageable gates, resolver precedence. |
| `src/app/api/settings/**` | Settings and provider-key APIs | VERIFIED | GET/PUT/POST/DELETE/validate routes return safe DTOs and structured 400s for malformed JSON. |
| `src/modules/market-data/server/provider-factory.ts` and `market-data-service.ts` | Credential wiring and sample gate | VERIFIED | Provider factory uses resolver; service checks settings before sample creation. |
| `src/app/settings/page.tsx` and `src/components/settings/*` | Settings UI | VERIFIED | Dynamic page loads server data; forms submit safe DTOs and call `router.refresh()` after successful mutations. |
| `.env.example` and `README.md` | Operator docs | VERIFIED | Env names documented without sample secrets; README documents `/settings`, saved-key precedence, fallback behavior, sample gating, and no-auth risk. |

GSD artifact verifier results: 28/28 plan artifacts passed existence and substance checks.

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Settings domain | DB schema/migration | Matching defaults and fields | VERIFIED | `alpha_vantage`, `confirm_before_fetch`, and `show_sample_data` align across domain, schema, migration. |
| Settings parser | Provider registry | Selectable default provider ids | VERIFIED | `selectableDefaultProviderIds` and `isSelectableDefaultProviderId` keep `sample`/`twelve_data` out of defaults. |
| Provider-key service | Encryption helper/repository | Encrypt before persistence, metadata after reads | VERIFIED | `encryptProviderApiKey` is called only after key-manageable validation; returned values map through `ProviderApiKeyMetadata`. |
| Validation route | Validation service | Explicit POST action | VERIFIED | Route delegates to `validateProviderKey` and returns safe metadata or safe errors. |
| Credential resolver | Provider factory | Resolver before provider construction | VERIFIED | `providerForSource("alpha_vantage")` calls `resolveProviderCredential("alpha_vantage")`. |
| Market-data service | Settings service | Server-side sample gate | VERIFIED | `showSampleData` is checked before sample provider creation. |
| Settings components | API routes | Client fetches and refresh | VERIFIED | Settings and key forms call `/api/settings` and `/api/settings/provider-keys*`; successful mutations call `router.refresh()`. |

GSD key-link verifier results: 18/18 declared key links verified.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `SettingsForm` | `formValues` | Server `currentSettings` prop, PUT `/api/settings`, `settings-service`, `app_settings` row | Yes | FLOWING |
| `ProviderKeyForm` | `apiKeyInputs`, `providerKeys` | User password input, provider-key API routes, encrypted repository rows, metadata mapper | Yes; plaintext only submitted, never prefills | FLOWING |
| `ProviderKeyTable` | `providerKeys` | Server page loads `getProviderApiKeyService().listProviderKeys()` | Yes; safe metadata only | FLOWING |
| `ProviderKeyValidationService` | `validationStatus`, `validationMessage`, `lastValidatedAt` | Saved encrypted row -> decrypt -> injected/live Alpha Vantage fetch -> repository update | Yes, but live provider requires human key/network test | FLOWING |
| `providerForSource` | `credentialResolution.apiKey` | Enabled saved row via resolver, else `ALPHA_VANTAGE_API_KEY` fallback | Yes | FLOWING |
| `market-data-service` | `settingsResult.value.showSampleData` | `getSettingsService().getSettings()` | Yes; blocks sample provider before construction when false | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Focused settings, API, forms, provider, and market-data tests | `bun run test -- test/settings/app-settings.test.ts test/settings/provider-registry.test.ts test/settings/provider-key-encryption.test.ts test/settings/settings-service.test.ts test/settings/provider-api-key-service.test.ts test/settings/provider-key-validation-service.test.ts test/settings/provider-credential-resolver.test.ts test/settings/settings-api-contract.test.ts test/settings/settings-forms.test.ts test/market-data/provider-factory.test.ts test/market-data/market-data-service.test.ts test/market-data/alpha-vantage-market-data-provider.test.ts` | 12 files, 70 tests passed | PASS |
| TypeScript compile | `bun run typecheck` | `tsc --noEmit` passed | PASS |
| Full repository verification | Orchestrator-provided `bun run verify` context | lint, typecheck, 16 test files, 84 tests, and Next production build passed | PASS |
| Schema drift gate | Orchestrator-provided context | `drift_detected: false` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| SET-01 | 01-05 | Admin can open a settings page from app navigation. | SATISFIED | `/settings` page exists and dashboard links to it. |
| SET-02 | 01-01 to 01-05 | Admin can choose a default market-data provider. | SATISFIED | Domain/settings/API/UI use selectable default providers; only `alpha_vantage` is accepted in Phase 1. |
| SET-03 | 01-01, 01-02, 01-03, 01-05 | Admin can choose confirm-before-fetch or silent fetch behavior. | SATISFIED | `missingDataBehavior` persists and UI renders both options. Execution/progress is deferred to Phase 3 by roadmap. |
| SET-04 | 01-01, 01-02, 01-03, 01-04, 01-05 | Admin can enable/disable sample/demo data visibility. | SATISFIED WITH UAT NOTE | Setting persists and server blocks sample creation when false. Existing `/market-data/new` source selector still lists `sample`; verify whether product expects hidden option or submit-time rejection. |
| KEY-01 | 01-01, 01-02, 01-03, 01-05 | Admin can create, view, update, and delete API keys for supported providers. | SATISFIED | Service, API, and UI support Alpha Vantage create/list/replace/enable/delete; sample/Twelve Data are rejected. |
| KEY-02 | 01-01 to 01-05 | Saved keys are sensitive server-side values and never exposed in full to browser. | SATISFIED | AES-GCM storage, server-only modules, metadata DTOs, API contract tests, and review fix for short-key masking. |
| KEY-03 | 01-01, 01-02, 01-03, 01-05 | Key lists show safe metadata. | SATISFIED | `ProviderKeyTable` renders provider, enabled status, masked suffix, validation status/message, and timestamps only. |
| KEY-04 | 01-03, 01-04, 01-05 | Admin can validate a saved provider key and see safe result. | SATISFIED AUTOMATED; LIVE HUMAN NEEDED | Validation service/route/test coverage present; live Alpha Vantage validation requires real key and network. |
| KEY-05 | 01-03, 01-04 | Provider fetches use persisted keys when available and may fall back to environment config. | SATISFIED | Resolver and provider factory implement saved-key precedence and environment fallback. |

No orphaned Phase 1 requirements found: `.planning/REQUIREMENTS.md` maps SET-01, SET-02, SET-03, SET-04, KEY-01, KEY-02, KEY-03, KEY-04, and KEY-05 to Phase 1, and all are claimed by one or more plan frontmatter blocks.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `src/components/settings/provider-key-form.tsx` | 105 | "not available" text | Info | Intentional read-only copy for non-key-manageable providers, not a stub. |
| `src/components/settings/provider-key-form.tsx` | 308 | input `placeholder` | Info | Normal password input placeholder, not placeholder implementation. |
| `src/modules/settings/server/service-singleton.ts` | 20 | nullable singleton caches | Info | Existing repo pattern with `maybe...` names. |
| `src/components/market-data/market-data-form.tsx` | 177 | static `marketDataSources` includes `sample` | Warning | Server gate blocks sample creation when hidden; UAT should confirm whether the source option should also be hidden/disabled. |

No blocking TODO/FIXME, empty handler, hardcoded empty render data, broad debug logging, plaintext key response, or ciphertext/IV/auth-tag UI serialization pattern was found in the Phase 1 implementation surface.

### Code Review Artifacts

`01-REVIEW-FIX.md` fixed all four review findings: short provider-key metadata leakage for short keys, missing `server-only` guard on Alpha Vantage provider, malformed JSON requests returning 500s, and stuck submitting states in settings forms. `01-REVIEW.md` then re-reviewed the fixed files and reports `status: clean` with no remaining findings.

### Human Verification Required

### 1. Settings UI Workflow

**Test:** Start the app with a migrated database, open `/`, click the `/settings` action, change default provider/missing-data/sample settings, and save.
**Expected:** The page remains operational, default-provider options are limited to Alpha Vantage, form errors are readable, and saved settings are visible after refresh.
**Why human:** Browser navigation, visual layout, and complete form ergonomics cannot be fully verified from static code checks.

### 2. Provider Key Live Workflow

**Test:** With `PROVIDER_KEYS_ENCRYPTION_SECRET` and a real Alpha Vantage key configured, save the key, validate it, disable/enable it, replace it, delete it, and run an Alpha Vantage market-data fetch.
**Expected:** The browser sees only safe metadata/masked suffix/status/timestamps; validation returns a safe result; enabled saved key takes precedence over `ALPHA_VANTAGE_API_KEY`.
**Why human:** Requires operator-supplied secret material and live external provider behavior.

### 3. Sample Visibility Semantics

**Test:** With `showSampleData` false, open `/market-data/new` and attempt to use the `sample` source; then enable `showSampleData` and retry.
**Expected:** Server-side behavior is already verified: hidden sample data is rejected and visible sample data works. Confirm whether the product expects the source option itself to hide/disable when the setting is false.
**Why human:** The code enforces the gate, but "visibility" versus "availability" is a product UX decision.

### Gaps Summary

No automated goal-blocking gaps were found. The phase achieved the settings/secrets foundation: durable defaults, safe provider metadata, encrypted provider-key storage, safe APIs, explicit sanitized validation, persisted-key-first provider fetch resolution, server-side sample gating, UI controls, docs, and review-fix closure are present and wired.

Overall status remains `human_needed` because Phase 1 includes browser/UI workflows and live provider validation that require human UAT.

---

_Verified: 2026-04-26T19:25:37Z_
_Verifier: the agent (gsd-verifier)_
