# Phase 01 Plan 02: User Setup Required

**Generated:** 2026-04-26
**Phase:** 01-provider-settings-and-secrets
**Plan:** 02
**Status:** Incomplete

Saved provider key create, update, and decrypt paths require a non-public server-side encryption secret.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `PROVIDER_KEYS_ENCRYPTION_SECRET` | Generate a private random secret with at least 32 UTF-8 bytes; do not use a `NEXT_PUBLIC_` prefix. | Local shell, deployment environment, or `.env.local` |

## Verification

After setting the secret, run the focused settings tests:

```bash
bun run test -- test/settings/provider-key-encryption.test.ts test/settings/provider-api-key-service.test.ts
```

Expected result:
- Provider key encryption and provider-key service tests pass.

---

**Once complete:** Mark status as "Complete" at top of this file.
