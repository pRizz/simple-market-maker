# Phase 01 Plan 05: User Setup Required

**Generated:** 2026-04-26
**Phase:** 01-provider-settings-and-secrets
**Status:** Incomplete

Complete these items before saved provider-key create, update, validation, or saved-key-backed fetches are expected to work in a local or deployed environment.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `PROVIDER_KEYS_ENCRYPTION_SECRET` | Create a non-public server secret with at least 32 characters. | Local `.env` and deployed app service |
| [ ] | `ALPHA_VANTAGE_API_KEY` | Optional Alpha Vantage dashboard fallback key. | Local `.env` and deployed app service |

## Notes

- `PROVIDER_KEYS_ENCRYPTION_SECRET` is required for saved provider key create, replace, decrypt, and validation paths.
- An enabled saved Alpha Vantage key takes precedence over `ALPHA_VANTAGE_API_KEY`.
- `ALPHA_VANTAGE_API_KEY` remains a read-only fallback during migration when no enabled saved key exists.
- Do not expose this single-admin, no-auth app publicly without an authentication boundary or network restriction.

## Verification

After configuration, verify:

- `/settings` shows the Alpha Vantage environment fallback as configured when the fallback is present.
- Saving a provider key from `/settings` succeeds when `PROVIDER_KEYS_ENCRYPTION_SECRET` is present.
- Validating a saved key returns safe validation metadata without showing the key value.

---

**Once all items complete:** Mark status as "Complete" at top of file.
