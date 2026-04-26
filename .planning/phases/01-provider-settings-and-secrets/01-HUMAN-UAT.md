---
status: partial
phase: 01-provider-settings-and-secrets
source: [01-VERIFICATION.md]
started: 2026-04-26T19:25:37Z
updated: 2026-04-26T19:25:37Z
---

# Phase 01 Human UAT

## Current Test

Awaiting human testing.

## Tests

### 1. Settings UI workflow

expected: From the dashboard, open `/settings`, save provider/default-fetch/sample settings, and see the page refresh with the new persisted values.
result: pending

### 2. Provider key live workflow

expected: With `PROVIDER_KEYS_ENCRYPTION_SECRET` set, save an Alpha Vantage key, validate it, disable/enable it, replace it, and delete it without any raw key value appearing in the browser.
result: pending

### 3. Sample visibility semantics

expected: When `showSampleData` is false, sample data is blocked server-side; verify whether product expects the `/market-data/new` source option to be hidden or merely rejected on submit.
result: pending

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
