---
phase: 01-provider-settings-and-secrets
fixed_at: 2026-04-26T19:17:51Z
review_path: .planning/phases/01-provider-settings-and-secrets/01-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-04-26T19:17:51Z
**Source review:** .planning/phases/01-provider-settings-and-secrets/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: Short Provider Keys Are Exposed In Metadata

**Files modified:** `src/modules/settings/domain/provider-api-key.ts`, `test/settings/provider-api-key-service.test.ts`
**Commit:** 7f3f666
**Applied fix:** Masked provider keys of four characters or fewer without preserving the original key text, and added a regression test proving short keys are absent from returned and stored safe metadata.

### WR-01: Alpha Vantage Provider Lacks Server-Only Guard

**Files modified:** `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`, `test/market-data/alpha-vantage-market-data-provider.test.ts`
**Commit:** 2d61101
**Applied fix:** Added the `server-only` guard to the Alpha Vantage provider and mocked it in the runtime import test.

### WR-02: Malformed JSON Requests Escape As 500s

**Files modified:** `src/app/api/settings/read-json-body.ts`, `src/app/api/settings/route.ts`, `src/app/api/settings/provider-keys/route.ts`, `src/app/api/settings/provider-keys/[providerId]/route.ts`, `test/settings/settings-api-contract.test.ts`
**Commit:** 1b32911
**Applied fix:** Added a shared settings route JSON-body reader that returns structured 400 responses for malformed JSON, wired it into settings and provider-key mutation routes, and added malformed-body contract tests for each route.

### WR-03: Settings Forms Can Stay Stuck Submitting After Request Failures

**Files modified:** `src/components/settings/provider-key-form.tsx`, `src/components/settings/settings-form.tsx`, `test/settings/settings-forms.test.ts`
**Commit:** c287c42
**Applied fix:** Reset settings and provider-key forms to idle with visible errors when fetch or JSON parsing fails, and added jsdom component tests for rejected fetch recovery.

## Verification

- `bun run test test/settings/provider-api-key-service.test.ts`
- `bun run test test/market-data/alpha-vantage-market-data-provider.test.ts`
- `bun run test test/settings/settings-api-contract.test.ts`
- `bun run test test/settings/settings-forms.test.ts`
- `bun run verify` passed before each fix commit.

---

_Fixed: 2026-04-26T19:17:51Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
