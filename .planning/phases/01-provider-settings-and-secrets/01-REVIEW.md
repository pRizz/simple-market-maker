---
phase: 01-provider-settings-and-secrets
reviewed: 2026-04-26T19:09:06Z
depth: standard
files_reviewed: 41
files_reviewed_list:
  - ".env.example"
  - "README.md"
  - "src/app/api/settings/provider-keys/[providerId]/route.ts"
  - "src/app/api/settings/provider-keys/[providerId]/validate/route.ts"
  - "src/app/api/settings/provider-keys/route.ts"
  - "src/app/api/settings/route.ts"
  - "src/app/page.tsx"
  - "src/app/settings/page.tsx"
  - "src/components/settings/provider-key-form.tsx"
  - "src/components/settings/provider-key-table.tsx"
  - "src/components/settings/provider-status-grid.tsx"
  - "src/components/settings/settings-form.tsx"
  - "src/modules/db/migrations/0002_provider_settings_and_secrets.sql"
  - "src/modules/db/migrations/meta/0002_snapshot.json"
  - "src/modules/db/migrations/meta/_journal.json"
  - "src/modules/db/schema.ts"
  - "src/modules/market-data/server/alpha-vantage-market-data-provider.ts"
  - "src/modules/market-data/server/market-data-service.ts"
  - "src/modules/market-data/server/provider-factory.ts"
  - "src/modules/settings/domain/app-settings.ts"
  - "src/modules/settings/domain/provider-api-key.ts"
  - "src/modules/settings/domain/provider-registry.ts"
  - "src/modules/settings/server/app-settings-repository.ts"
  - "src/modules/settings/server/provider-api-key-repository.ts"
  - "src/modules/settings/server/provider-api-key-service.ts"
  - "src/modules/settings/server/provider-credential-resolver.ts"
  - "src/modules/settings/server/provider-error-sanitizer.ts"
  - "src/modules/settings/server/provider-key-encryption.ts"
  - "src/modules/settings/server/provider-key-validation-service.ts"
  - "src/modules/settings/server/service-singleton.ts"
  - "src/modules/settings/server/settings-service.ts"
  - "test/market-data/market-data-service.test.ts"
  - "test/market-data/provider-factory.test.ts"
  - "test/settings/app-settings.test.ts"
  - "test/settings/provider-api-key-service.test.ts"
  - "test/settings/provider-credential-resolver.test.ts"
  - "test/settings/provider-key-encryption.test.ts"
  - "test/settings/provider-key-validation-service.test.ts"
  - "test/settings/provider-registry.test.ts"
  - "test/settings/settings-api-contract.test.ts"
  - "test/settings/settings-service.test.ts"
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-26T19:09:06Z
**Depth:** standard
**Files Reviewed:** 41
**Status:** issues_found

## Summary

Reviewed the provider settings, saved-key persistence, encryption, validation, API routes, UI forms, migration artifacts, docs, and tests. Local guidance used: `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`, and the pinned Bright Builds standards for architecture, code shape, verification, testing, and TypeScript/JavaScript. The local `standards/index.md` file is missing, so the pinned upstream pages were loaded from the sidecar commit.

The key concern is that the masking helper can expose an entire short provider key through supposedly safe metadata. The remaining issues are warning-level hardening and error-path regressions.

## Critical Issues

### CR-01: Short Provider Keys Are Exposed In Metadata

**File:** `src/modules/settings/domain/provider-api-key.ts:33`
**Issue:** `maskedSuffixFromApiKey()` returns the complete trimmed API key when the key is four characters or fewer. `saveProviderKey()` then stores and returns `maskedSuffix: "****" + maskedSuffixFromApiKey(...)`, so a short key like `ABCD` becomes `****ABCD`, which still contains the full secret. The service accepts any non-empty key, and README promises that saved provider key values are never displayed.
**Fix:**
```ts
export function maskedSuffixFromApiKey(apiKey: string): string {
  const trimmedApiKey = apiKey.trim();

  if (trimmedApiKey.length <= 4) {
    return "****";
  }

  return trimmedApiKey.slice(-4);
}
```
Add a regression test that saving `"ABCD"` returns metadata that does not contain `"ABCD"`, or reject too-short provider keys before encryption if that matches the provider contract.

## Warnings

### WR-01: Alpha Vantage Provider Lacks Server-Only Guard

**File:** `src/modules/market-data/server/alpha-vantage-market-data-provider.ts:1`
**Issue:** This server module reads `process.env.ALPHA_VANTAGE_API_KEY`, builds provider URLs containing API keys, and performs network fetches, but it does not start with `import "server-only";`. Most neighboring `server/` modules do, and the repo conventions require the guard for server modules touching environment, network providers, or secrets. A future direct client import could pull key-handling code across the server/client boundary.
**Fix:**
```ts
import "server-only";

import type { Candle } from "@/modules/backtests/domain/candle";
```
Keep the existing `server-only` mocks in tests that import this module at runtime.

### WR-02: Malformed JSON Requests Escape As 500s

**File:** `src/app/api/settings/route.ts:47`, `src/app/api/settings/provider-keys/route.ts:26`, `src/app/api/settings/provider-keys/[providerId]/route.ts:68`
**Issue:** The settings mutation routes call `await request.json()` before entering the typed validation path. Invalid JSON or an unreadable request body throws from the route handler and produces a framework 500 instead of the same structured 400 response used for invalid settings/key input. The API contract tests cover unsupported values, but not malformed JSON bodies.
**Fix:**
```ts
async function readJsonBody(request: Request): Promise<
  | { ok: true; value: unknown }
  | { ok: false; response: Response }
> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "Request body must be valid JSON." },
        { status: 400 },
      ),
    };
  }
}
```
Use the helper in each mutation route and add API contract tests for malformed JSON.

### WR-03: Settings Forms Can Stay Stuck Submitting After Request Failures

**File:** `src/components/settings/provider-key-form.tsx:146`, `src/components/settings/settings-form.tsx:60`
**Issue:** `performMutation()` and `updateSettings()` assume `fetch()` succeeds and that every response body is JSON. Network failures, aborted requests, or a non-JSON 500 response reject before the state is reset, leaving the form in `submitting` with disabled controls and no visible error.
**Fix:**
```ts
try {
  const result = await parseProviderKeyResponse(await mutation());
  // existing success/failure state handling
} catch {
  setSubmissionState({
    activeAction: null,
    fieldErrors: {},
    formErrors: ["Provider key action failed."],
    status: "idle",
  });
}
```
Apply the same pattern to settings saves, or make both helpers return a shared `{ ok: false, formErrors }` result on thrown fetch/JSON parsing failures.

---

_Reviewed: 2026-04-26T19:09:06Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
