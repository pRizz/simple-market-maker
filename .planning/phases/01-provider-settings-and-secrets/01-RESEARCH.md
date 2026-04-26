# Phase 1: Provider Settings and Secrets - Research

**Researched:** 2026-04-26  
**Domain:** Next.js App Router settings, provider credential storage, Drizzle/PostgreSQL schema, server-only secret handling  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

Every item in this section is copied verbatim from `.planning/phases/01-provider-settings-and-secrets/01-CONTEXT.md`. [VERIFIED: `.planning/phases/01-provider-settings-and-secrets/01-CONTEXT.md`]

### Locked Decisions

## Implementation Decisions

### Settings Surface

- **D-01:** Add a dedicated `/settings` page reachable from app navigation or the home page actions.
- **D-02:** Keep the settings page operational and data-forward. It should focus on provider defaults, missing-data behavior, sample/demo visibility, and provider key readiness.
- **D-03:** Persist settings in a single-row `app_settings` table with at least `defaultProvider`, `missingDataBehavior`, and `showSampleData` or an equivalent sample gate.
- **D-04:** Default settings should be `alpha_vantage` as the provider, `confirm_before_fetch` as the missing-data behavior, and sample/demo data hidden from normal real-data flows.
- **D-05:** The silent-fetch setting may be stored now, but actual silent fetch progress and run orchestration are Phase 3 work.

### Provider Registry

- **D-06:** Add a provider registry descriptor layer rather than scattering provider metadata across UI and services.
- **D-07:** Provider descriptors should include provider id, display label, implementation status, key requirement, environment fallback name when applicable, supported intervals, and a short safe status/help description.
- **D-08:** Alpha Vantage is the implemented real provider for this phase.
- **D-09:** Sample data remains available only as a gated demo/development source.
- **D-10:** Twelve Data may appear as a planned or disabled descriptor if useful for key/settings UI, but the actual Twelve Data adapter and provider behavior belong to Phase 4.

### Provider API Key CRUD

- **D-11:** Add a `provider_api_keys` table for single-admin provider credentials.
- **D-12:** For v1, allow one saved key per provider. Replacing a key should update that provider's saved secret and metadata rather than creating a multi-key vault.
- **D-13:** Store server-only secret material plus safe metadata: provider id, masked suffix, enabled status, validation status, validation message or code, last validated timestamp, created timestamp, and updated timestamp.
- **D-14:** The browser must never receive a raw saved key after submission. Lists and detail views should receive only safe metadata.
- **D-15:** Delete should remove the saved provider key. Disable should keep the key but exclude it from provider-backed fetches.

### Secret Storage and Resolution

- **D-16:** Use a server-only crypto helper built on `node:crypto` AES-GCM with a non-public `PROVIDER_KEYS_ENCRYPTION_SECRET` environment variable.
- **D-17:** If the encryption secret is missing, saved-key create, update, and decrypt paths should fail closed with a safe user-facing error. Existing environment fallback can still be used during migration when no saved key is needed.
- **D-18:** Persisted keys take precedence over environment keys for provider-backed fetches.
- **D-19:** Keep the existing `ALPHA_VANTAGE_API_KEY` fallback read-only. The UI may show that an environment fallback is configured, but it must not reveal the value.
- **D-20:** Do not introduce hosted secret managers, multi-user credential ownership, or account/team abstractions in this phase.

### Key Validation

- **D-21:** Validation should be an explicit admin action, not an automatic request on every settings page load.
- **D-22:** Validation should run a minimal provider check and record a sanitized success or failure status with a timestamp.
- **D-23:** Provider validation responses must not expose raw request URLs, raw keys, or unsanitized provider response bodies to the browser.
- **D-24:** The exact validation symbol/range is implementation discretion, but it should use a stable liquid US equity, be injectable for tests, and avoid expensive or broad provider calls.

### UI and Magic UI

- **D-25:** Reuse the existing app shell patterns first: `PageHeader`, `DataTable`, `StatCard`, `EmptyState`, and current Tailwind styling.
- **D-26:** Use Magic UI selectively only where it clarifies provider readiness, validation, loading, or empty states. A copied/adapted Magic Card-style provider status surface is acceptable.
- **D-27:** Do not initialize a full shadcn rewrite or broad Magic UI visual overhaul in this phase. Larger Magic UI polish belongs to Phase 7.
- **D-28:** Keep the UI single-admin and pragmatic. No auth, user profile, team, billing, or public SaaS settings.

### the agent's Discretion

- Exact route placement, page copy, field labels, form component decomposition, and action button layout are implementation discretion as long as the page is reachable and clear.
- The planner may decide whether provider keys are edited inline, through modal/dialog UI, or through simple forms.
- The planner may decide whether to show provider status as cards above a table or as a compact table with detail panels, as long as raw secrets never cross the server/client boundary.
- The planner may choose the minimal copied Magic UI component surface or defer Magic UI to a later phase if it would cause disproportionate setup churn.

### Deferred Ideas (OUT OF SCOPE)

- Full missing-data preflight, confirm modal, silent-fetch progress, request dedupe, and quota-aware fetch lifecycle belong to Phase 3.
- Twelve Data provider adapter and second-provider behavior belong to Phase 4 after validation with a real Basic key.
- CSV import and custom market-data source workflows belong to Phase 5.
- Volatility metrics and metric correctness belong to Phase 6.
- Provider-labeled charts and broader Magic UI polish belong to Phase 7.
- Live brokerage integrations, order ladders, real P/L dashboards, and real order placement belong to a future milestone.
</user_constraints>

## Project Constraints (from AGENTS.md)

- Planning, implementation, review, and audit work must read `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`, and relevant pinned Bright Builds standards before proceeding. [VERIFIED: `AGENTS.md`; `AGENTS.bright-builds.md`; pinned Bright Builds `standards/index.md`]
- The project stack remains Bun, Next.js App Router, TypeScript, PostgreSQL, Drizzle ORM, Tailwind CSS, and ECharts. [VERIFIED: `AGENTS.md`; `package.json`; `bun.lock`]
- Provider keys must be treated as sensitive while preserving the single-admin product model for this milestone. [VERIFIED: `AGENTS.md`; `.planning/REQUIREMENTS.md`]
- Implementation changes should use the repo-native `bun run verify` before commit. [VERIFIED: `AGENTS.md`; `package.json`]
- Business logic should stay in functional-core modules and I/O should stay in imperative shells. [VERIFIED: `AGENTS.bright-builds.md`; pinned Bright Builds `standards/core/architecture.md`]
- Raw input should be parsed at boundaries before domain or repository code uses it. [VERIFIED: `AGENTS.bright-builds.md`; `.planning/codebase/CONVENTIONS.md`; pinned Bright Builds `standards/core/architecture.md`]
- Internal nullable values and absence-like functions should use the `maybe` naming convention. [VERIFIED: `AGENTS.bright-builds.md`; `.planning/codebase/CONVENTIONS.md`; pinned Bright Builds `standards/core/code-shape.md`]
- Unit tests should cover pure/business logic, test one concern, and use Arrange, Act, Assert structure. [VERIFIED: `AGENTS.md`; pinned Bright Builds `standards/core/testing.md`; `.planning/codebase/TESTING.md`]
- Server modules that touch database, environment, network providers, or secrets must start with `import "server-only";`. [VERIFIED: `.planning/codebase/CONVENTIONS.md`; `src/modules/market-data/server/market-data-service.ts`]
- No project-local skills exist under `.claude/skills/` or `.agents/skills/`. [VERIFIED: shell check for `.claude/skills` and `.agents/skills`]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SET-01 | Admin can open a settings page from the app navigation. | Add `src/app/settings/page.tsx` and a persistent or clearly repeated Settings link using existing App Router layout patterns. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/layout.tsx`; Next.js route handler/page conventions] |
| SET-02 | Admin can choose a default market-data provider for new fetches and missing-data backtest flows. | Persist `defaultProvider` in `app_settings`; initially allow implemented real provider `alpha_vantage`, with registry descriptors as the source of UI labels and status. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`; `src/modules/market-data/server/provider-factory.ts`] |
| SET-03 | Admin can choose confirm-before-fetch or silent fetch with visible progress. | Persist `missingDataBehavior`; keep execution of silent fetch progress for Phase 3. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`] |
| SET-04 | Admin can enable or disable sample/demo data visibility. | Persist `showSampleData` defaulting false; use it to hide or reject sample creation in normal UI/service paths without deleting existing sample chunks. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`; `src/modules/market-data/domain/market-data-chunk.ts`] |
| KEY-01 | Admin can create, view, update, and delete provider API keys. | Add `provider_api_keys` repository/service/API/UI flows with one row per provider and replace-on-update behavior. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`; Drizzle unique constraints docs] |
| KEY-02 | Saved provider API keys are stored server-side as sensitive values and are never exposed back to the browser in full. | Use server-only AES-GCM helper, safe metadata mappers, and route responses that omit ciphertext, IV, tag, and plaintext. [VERIFIED: `01-CONTEXT.md`; Node.js crypto docs; Next.js environment docs; OWASP Cryptographic Storage Cheat Sheet] |
| KEY-03 | Provider API key lists show safe metadata. | Return provider id/label, enabled status, masked suffix, validation status/message code, and timestamps only. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`] |
| KEY-04 | Admin can validate a saved provider key and see a safe result. | Add explicit validation action that decrypts server-side, calls a minimal provider check through injectable fetch, stores sanitized status, and never returns raw URL/body/key. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`; Alpha Vantage documentation] |
| KEY-05 | Provider-backed fetches use persisted API keys when available and may fall back to existing environment configuration. | Add async credential resolver and update Alpha Vantage provider creation so enabled saved keys win over `ALPHA_VANTAGE_API_KEY`. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`; `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`] |
</phase_requirements>

## Summary

Phase 1 should add a narrow `settings` module rather than spreading settings, provider metadata, and credential logic through market-data components and providers. [VERIFIED: `01-CONTEXT.md`; `.planning/codebase/ARCHITECTURE.md`] The module should own app settings, provider descriptors, provider key CRUD, safe metadata mapping, AES-GCM encryption/decryption, explicit key validation, and server-side credential resolution. [VERIFIED: `01-CONTEXT.md`; OWASP Cryptographic Storage Cheat Sheet; Node.js crypto docs]

The cleanest migration path is to keep Alpha Vantage as the only implemented real provider, store `app_settings` and `provider_api_keys` in PostgreSQL, and make market-data provider creation await credential resolution before constructing the Alpha Vantage adapter. [VERIFIED: `01-CONTEXT.md`; `src/modules/market-data/server/provider-factory.ts`; `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`] This preserves the existing `ALPHA_VANTAGE_API_KEY` fallback while giving persisted enabled keys precedence for provider-backed fetches. [VERIFIED: `01-CONTEXT.md`; `src/components/market-data/market-data-form.tsx`]

**Primary recommendation:** Build `src/modules/settings/{domain,server}/`, `src/app/settings/page.tsx`, and `src/app/api/settings/**` around safe metadata and async credential resolution; do not add auth, a hosted secret manager, a full shadcn initialization, or a new provider adapter in this phase. [VERIFIED: `01-CONTEXT.md`; `AGENTS.md`; Magic UI installation docs]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bun | `packageManager` is `bun@1.3.13`; local CLI is `1.3.9`. [VERIFIED: `package.json`; `bun --version`] | Script runner and package manager. [VERIFIED: `package.json`] | Repo scripts and lockfile use Bun. [VERIFIED: `package.json`; `bun.lock`] |
| Next.js App Router | `next@16.2.4` in `bun.lock`; npm latest checked as `16.2.4`. [VERIFIED: `bun.lock`; npm registry] | `/settings` page and API route handlers. [VERIFIED: `src/app/**`; Next.js route handler docs] | Existing app uses App Router pages and `src/app/api/**` routes. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; `src/app/api/market-data/route.ts`] |
| React | `react@19.2.5` in `bun.lock`; `package.json` allows `^19.2.0`. [VERIFIED: `bun.lock`; `package.json`] | Settings UI components and forms. [VERIFIED: `src/components/**`] | Existing UI is React/TSX. [VERIFIED: `.planning/codebase/STACK.md`] |
| TypeScript | `typescript@5.9.3` in `bun.lock`. [VERIFIED: `bun.lock`] | Domain types, service result unions, route typing. [VERIFIED: `.planning/codebase/CONVENTIONS.md`] | Repo uses strict TypeScript and `@/*` path alias. [VERIFIED: `tsconfig.json`; `.planning/codebase/CONVENTIONS.md`] |
| PostgreSQL + Drizzle ORM | `drizzle-orm@0.44.7` installed; npm latest checked as `0.45.2`; keep repo version for this phase. [VERIFIED: node_modules; npm registry] | `app_settings` and `provider_api_keys` tables. [VERIFIED: `src/modules/db/schema.ts`; Drizzle PostgreSQL docs] | Existing persisted features already use Drizzle repositories. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; `src/modules/market-data/server/market-data-chunk-repository.ts`] |
| Drizzle Kit | `drizzle-kit@0.31.10` in `bun.lock`; npm latest checked as `0.31.10`. [VERIFIED: `bun.lock`; npm registry] | Generate SQL migration from schema changes. [VERIFIED: `drizzle.config.ts`; Drizzle generate docs] | Repo already owns `bun run db:generate` and migration files. [VERIFIED: `package.json`; `src/modules/db/migrations/meta/_journal.json`] |
| Zod | `zod@4.3.6` in `bun.lock`; npm latest checked as `4.3.6`. [VERIFIED: `bun.lock`; npm registry] | Parse settings/key CRUD inputs at boundaries. [VERIFIED: `.planning/codebase/CONVENTIONS.md`] | Existing form/domain validation uses Zod result unions. [VERIFIED: `src/modules/market-data/domain/market-data-validation.ts`] |
| `node:crypto` | Available through Node `v24.13.0` and Bun's Node-compatible runtime. [VERIFIED: `node --version`; Bun/Node runtime check] | AES-256-GCM encryption helper. [VERIFIED: Node.js crypto docs] | Locked decision requires `node:crypto` AES-GCM and no new crypto dependency. [VERIFIED: `01-CONTEXT.md`] |
| Tailwind CSS | `tailwindcss@4.2.4` in `bun.lock`; `package.json` allows `^4.1.16`. [VERIFIED: `bun.lock`; `package.json`] | Settings page styling. [VERIFIED: `src/app/globals.css`; `postcss.config.mjs`] | Existing UI primitives are Tailwind-first. [VERIFIED: `src/components/ui/shell.tsx`; `src/components/ui/data-table.tsx`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `motion` | npm latest checked as `12.38.0`. [VERIFIED: npm registry] | Required by current Magic Card source. [VERIFIED: Magic Card registry source] | Add only if Phase 1 copies a Magic UI card/effect. [VERIFIED: Magic UI docs; `01-CONTEXT.md`] |
| `lucide-react` | npm latest checked as `1.11.0`. [VERIFIED: npm registry] | Operational icons in settings buttons/status. [VERIFIED: npm registry; developer UI guidance] | Add if settings controls use icons. [VERIFIED: developer UI guidance] |
| `clsx` | npm latest checked as `2.1.1`. [VERIFIED: npm registry] | Local `cn()` helper support. [VERIFIED: Magic Card registry source] | Add if copied UI components need class composition. [VERIFIED: Magic Card registry source] |
| `tailwind-merge` | npm latest checked as `3.5.0`. [VERIFIED: npm registry] | Local `cn()` helper support. [VERIFIED: Magic Card registry source] | Add with `clsx` only if copied components need it. [VERIFIED: Magic Card registry source] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| App-level AES-GCM helper | Hosted secret manager or KMS | Better key isolation, but explicitly out of scope for this single-admin phase. [VERIFIED: `01-CONTEXT.md`; OWASP Cryptographic Storage Cheat Sheet] |
| Drizzle schema tables | JSON config file or env-only settings | Env-only state cannot satisfy durable settings/key CRUD requirements. [VERIFIED: `.planning/REQUIREMENTS.md`; `.env.example`] |
| Existing UI primitives | Full shadcn/Magic UI initialization | Magic UI install follows shadcn-style setup, which is more churn than Phase 1 needs. [VERIFIED: Magic UI installation docs; `01-CONTEXT.md`] |
| Native `fetch` provider checks | Vendor SDK | Existing Alpha Vantage adapter already uses native fetch and injectable `fetchFn`. [VERIFIED: `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`] |

**Installation:**

```bash
# Required for Phase 1 core work: no new packages. [VERIFIED: package.json; 01-CONTEXT.md]

# Optional only if copied Magic UI status surfaces are included. [VERIFIED: Magic UI docs; npm registry]
bun add motion lucide-react clsx tailwind-merge
```

**Version verification:** `npm view` confirmed `next@16.2.4`, `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`, `zod@4.3.6`, `motion@12.38.0`, `lucide-react@1.11.0`, `clsx@2.1.1`, and `tailwind-merge@3.5.0` on 2026-04-26. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure

```text
src/
|-- app/
|   |-- settings/
|   |   `-- page.tsx                     # Server-rendered settings page. [VERIFIED: Next.js App Router docs]
|   `-- api/
|       `-- settings/
|           |-- route.ts                  # GET/PUT app settings. [VERIFIED: Next.js route handler docs]
|           `-- provider-keys/
|               |-- route.ts              # GET/POST safe key metadata and create. [VERIFIED: existing API route pattern]
|               `-- [providerId]/
|                   |-- route.ts          # PUT/DELETE key metadata actions. [VERIFIED: existing API route pattern]
|                   `-- validate/route.ts # POST explicit validation. [VERIFIED: 01-CONTEXT.md]
|-- components/
|   `-- settings/
|       |-- settings-form.tsx             # Client settings form. [VERIFIED: existing form pattern]
|       |-- provider-key-form.tsx         # Client create/update form. [VERIFIED: existing form pattern]
|       `-- provider-key-table.tsx        # Safe metadata table. [VERIFIED: DataTable pattern]
`-- modules/
    |-- settings/
    |   |-- domain/
    |   |   |-- app-settings.ts           # Settings unions/defaults/parser. [VERIFIED: local domain pattern]
    |   |   |-- provider-api-key.ts       # Safe metadata/result types. [VERIFIED: 01-CONTEXT.md]
    |   |   `-- provider-registry.ts      # Provider descriptors. [VERIFIED: 01-CONTEXT.md]
    |   `-- server/
    |       |-- app-settings-repository.ts
    |       |-- provider-api-key-repository.ts
    |       |-- provider-key-encryption.ts
    |       |-- provider-credential-resolver.ts
    |       |-- provider-key-validation-service.ts
    |       |-- settings-service.ts
    |       `-- service-singleton.ts
    `-- db/
        `-- schema.ts                     # Add app_settings and provider_api_keys. [VERIFIED: local schema pattern]
```

### Pattern 1: Single Settings Service Boundary

**What:** Add `createSettingsService()` as the application boundary for settings CRUD, provider key CRUD, validation, and safe status reads. [VERIFIED: `src/modules/backtests/server/backtest-service.ts`; `src/modules/market-data/server/market-data-service.ts`]  
**When to use:** Use this service from `/settings` and `/api/settings/**`; do not let pages import repositories or encryption helpers directly. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`]  
**Example:**

```typescript
// Source: existing service-factory pattern in src/modules/market-data/server/market-data-service.ts. [VERIFIED: codebase]
export function createSettingsService(dependencies: SettingsServiceDependencies = {}) {
  const settingsRepository =
    dependencies.settingsRepository ?? createAppSettingsRepository();
  const providerKeyRepository =
    dependencies.providerKeyRepository ?? createProviderApiKeyRepository();

  return {
    async getSettingsSummary(): Promise<SettingsSummary> {
      const settings = await settingsRepository.getOrCreateSettings();
      const keys = await providerKeyRepository.listSafeProviderKeys();

      return toSettingsSummary(settings, keys);
    },
  };
}
```

### Pattern 2: App Settings and Provider Key Schema

**What:** Add `app_settings` as a singleton table and `provider_api_keys` as one row per provider. [VERIFIED: `01-CONTEXT.md`; Drizzle unique constraints docs]  
**When to use:** Use `app_settings` for defaults and gates; use `provider_api_keys` for encrypted secret material plus safe metadata. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`]  
**Recommended schema shape:**

| Table | Column | Shape | Planner Note |
|-------|--------|-------|--------------|
| `app_settings` | `id` | `text` primary key with value `singleton` | Repository should upsert/read one row. [VERIFIED: `01-CONTEXT.md`] |
| `app_settings` | `default_provider` | `text` or provider enum | Prefer `text` plus registry parser if Twelve Data descriptor should not force enum churn. [VERIFIED: `01-CONTEXT.md`; Drizzle enum migration implication from local schema] |
| `app_settings` | `missing_data_behavior` | enum/text: `confirm_before_fetch`, `silent_fetch` | Stable two-value setting. [VERIFIED: `.planning/REQUIREMENTS.md`] |
| `app_settings` | `show_sample_data` | `boolean` default false | Default hides sample/demo data. [VERIFIED: `01-CONTEXT.md`] |
| `provider_api_keys` | `provider_id` | `text` unique not null | Enforces one saved key per provider. [VERIFIED: `01-CONTEXT.md`; Drizzle unique constraints docs] |
| `provider_api_keys` | `encrypted_key`, `iv`, `auth_tag` | `text` not null | Store ciphertext and AES-GCM materials, not plaintext. [VERIFIED: Node.js crypto docs; OWASP Cryptographic Storage Cheat Sheet] |
| `provider_api_keys` | `encrypted_key_version` | `text` default `v1` | Supports future rotation metadata without exposing a secret. [VERIFIED: OWASP Secrets Management Cheat Sheet] |
| `provider_api_keys` | `masked_suffix` | `text` not null | Browser-safe key identity metadata. [VERIFIED: `01-CONTEXT.md`] |
| `provider_api_keys` | `enabled` | `boolean` default true | Disabled keys remain stored but are excluded from credential resolution. [VERIFIED: `01-CONTEXT.md`] |
| `provider_api_keys` | `validation_status` | enum/text: `not_validated`, `valid`, `invalid` | Explicit validation state. [VERIFIED: `01-CONTEXT.md`] |
| `provider_api_keys` | `validation_message` | nullable safe text/code | Never store raw provider response bodies. [VERIFIED: `01-CONTEXT.md`; OWASP Secrets Management Cheat Sheet] |
| `provider_api_keys` | `last_validated_at`, `created_at`, `updated_at` | timestamptz | Required metadata. [VERIFIED: `01-CONTEXT.md`] |

### Pattern 3: Server-Only AES-GCM Helper

**What:** Use `node:crypto` with `aes-256-gcm`, a 32-byte key decoded from `PROVIDER_KEYS_ENCRYPTION_SECRET`, a fresh 12-byte random IV per encryption, and a 16-byte auth tag. [VERIFIED: `01-CONTEXT.md`; Node.js crypto docs; OWASP Cryptographic Storage Cheat Sheet]  
**When to use:** Call only from server modules that start with `import "server-only";`. [VERIFIED: `.planning/codebase/CONVENTIONS.md`]  
**Example:**

```typescript
// Source: Node.js crypto createCipheriv/createDecipheriv guidance. [CITED: https://nodejs.org/api/crypto.html]
import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const algorithm = "aes-256-gcm";
const authTagLength = 16;

function encryptionKeyFromEnvironment(): Buffer {
  const maybeSecret = process.env.PROVIDER_KEYS_ENCRYPTION_SECRET;

  if (!maybeSecret) {
    throw new Error("Provider key encryption is not configured.");
  }

  const key = Buffer.from(maybeSecret, "base64");
  if (key.length !== 32) {
    throw new Error("Provider key encryption is misconfigured.");
  }

  return key;
}

export function encryptProviderSecret(plaintext: string): EncryptedProviderSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, encryptionKeyFromEnvironment(), iv, {
    authTagLength,
  });
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
  };
}
```

### Pattern 4: Credential Resolver Before Provider Construction

**What:** Resolve credentials in server code before Alpha Vantage fetches so enabled saved keys win over `ALPHA_VANTAGE_API_KEY`, and missing/disabled saved keys can still use the migration fallback. [VERIFIED: `01-CONTEXT.md`; `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`]  
**When to use:** Update `providerFactory` from a synchronous factory to an async factory, or pass an async resolver into the Alpha Vantage provider and await it inside `fetchCandles()`. [VERIFIED: `src/modules/market-data/server/provider-factory.ts`; `src/modules/market-data/server/market-data-service.ts`]  
**Recommended shape:** Prefer an async provider factory because credential lookup/decryption is server I/O and the current market-data service already awaits provider calls. [VERIFIED: `src/modules/market-data/server/market-data-service.ts`; `.planning/codebase/ARCHITECTURE.md`]

```typescript
// Source: current provider factory plus Phase 1 credential precedence decision. [VERIFIED: codebase; 01-CONTEXT.md]
export type MarketDataProviderFactory = (
  source: MarketDataSource,
) => Promise<MarketDataFetchProvider>;

export async function providerForSource(
  source: MarketDataSource,
): Promise<MarketDataFetchProvider> {
  if (source === "sample") {
    return new SampleMarketDataFetchProvider();
  }

  const credential = await resolveProviderCredential("alpha_vantage");
  return new AlphaVantageMarketDataProvider({
    apiKey: credential.apiKey,
  });
}
```

### Pattern 5: Safe API Responses

**What:** Route handlers should map service results to JSON, but service methods must omit raw secrets, ciphertext, IVs, auth tags, raw provider URLs, and raw provider bodies before data crosses to the browser. [VERIFIED: `01-CONTEXT.md`; Next.js route handler docs; OWASP Secrets Management Cheat Sheet]  
**When to use:** Use safe DTOs for `GET /api/settings`, `GET /api/settings/provider-keys`, create/update/delete results, and validation results. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/api/market-data/route.ts`]

### Anti-Patterns to Avoid

- **Reading `process.env.ALPHA_VANTAGE_API_KEY` inside the provider forever:** It keeps credential precedence hidden and makes persisted keys hard to test. [VERIFIED: `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`; `01-CONTEXT.md`]
- **Returning provider errors verbatim:** Current provider errors can include provider text; Phase 1 validation and future fetches need sanitized result codes/messages. [VERIFIED: `.planning/codebase/CONCERNS.md`; `src/modules/market-data/server/market-data-service.ts`; `01-CONTEXT.md`]
- **Using `NEXT_PUBLIC_PROVIDER_KEYS_ENCRYPTION_SECRET`:** Next.js bundles `NEXT_PUBLIC_` values into browser JavaScript. [CITED: https://nextjs.org/docs/app/guides/environment-variables]
- **Only hiding sample data in the UI:** API callers could still create sample chunks unless the server service applies the setting. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/api/market-data/route.ts`]
- **Initializing full shadcn for one card:** Magic UI documents shadcn-style installation, and the phase decisions reject a broad visual rewrite. [CITED: https://magicui.design/docs/installation; VERIFIED: `01-CONTEXT.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Symmetric encryption | Custom cipher, homemade IV/tag format, or string obfuscation | `node:crypto` AES-256-GCM helper | OWASP recommends AES with authenticated modes such as GCM, and Node supports GCM auth tags and IV handling. [CITED: OWASP Cryptographic Storage Cheat Sheet; Node.js crypto docs] |
| Provider input parsing | Ad hoc object checks in route handlers | Zod parsers in `settings/domain` | Existing code parses boundary input with Zod and result unions. [VERIFIED: `.planning/codebase/CONVENTIONS.md`; `src/modules/market-data/domain/market-data-validation.ts`] |
| Secret metadata redaction | Formatting raw secrets in components | Safe DTO mapper in server service | Browser responses must never include raw secrets. [VERIFIED: `01-CONTEXT.md`] |
| Provider metadata | Duplicated labels/status copy in UI and services | `provider-registry.ts` descriptors | Phase decision requires registry descriptors. [VERIFIED: `01-CONTEXT.md`] |
| Migrations | Manual SQL without schema source | Drizzle schema plus generated migration, with hand-reviewed seed SQL | Repo already uses Drizzle schema and generated migration files. [VERIFIED: `drizzle.config.ts`; `src/modules/db/migrations/meta/_journal.json`; Drizzle generate docs] |
| Provider validation | Live API calls during page load | Explicit `POST validate` action with injectable fetch | Validation is explicitly admin-triggered and testable without real provider calls. [VERIFIED: `01-CONTEXT.md`; `.planning/codebase/TESTING.md`] |

**Key insight:** The risky surface is not basic CRUD; it is accidental secret exposure across server/client boundaries, provider fallback ambiguity, and raw provider error leakage. [VERIFIED: `.planning/codebase/CONCERNS.md`; `01-CONTEXT.md`]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing DB has `backtest_definitions`, `backtest_runs`, and `market_data_chunks`; no `app_settings` or `provider_api_keys` tables exist in `src/modules/db/schema.ts`. [VERIFIED: `src/modules/db/schema.ts`] | Add schema and migration; seed singleton `app_settings` default row. [VERIFIED: `01-CONTEXT.md`; Drizzle generate docs] |
| Live service config | `ALPHA_VANTAGE_API_KEY` and `MARKET_DATA_SOURCE` are environment-based today. [VERIFIED: `.env.example`; `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`; `src/modules/backtests/server/service-singleton.ts`] | Add read-only fallback display for `ALPHA_VANTAGE_API_KEY`; do not migrate or expose existing env value. [VERIFIED: `01-CONTEXT.md`; Next.js environment docs] |
| OS-registered state | None found for this phase; no launchd/systemd/pm2 names were detected or referenced in planning/codebase files. [VERIFIED: `rg --files`; `.planning/codebase/STRUCTURE.md`] | None. [VERIFIED: codebase audit] |
| Secrets/env vars | `PROVIDER_KEYS_ENCRYPTION_SECRET` is missing from the current shell and `.env.example`; `ALPHA_VANTAGE_API_KEY` is also missing from the current shell. [VERIFIED: environment checks; `.env.example`] | Add `PROVIDER_KEYS_ENCRYPTION_SECRET=` to `.env.example` with generation guidance but no value; keep `ALPHA_VANTAGE_API_KEY` fallback documented. [VERIFIED: `01-CONTEXT.md`; Next.js environment docs] |
| Build artifacts | No build artifact contains settings/provider key schema because no phase files exist yet. [VERIFIED: `rg settings provider_api_keys src test`] | Run `bun run db:generate` after schema edit and commit generated migration metadata. [VERIFIED: `package.json`; Drizzle generate docs] |

## Common Pitfalls

### Pitfall 1: Environment Fallback Bypasses Persisted Keys

**What goes wrong:** Alpha Vantage keeps reading `process.env.ALPHA_VANTAGE_API_KEY` inside the adapter, so saved keys do not actually take precedence. [VERIFIED: `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`; `01-CONTEXT.md`]  
**Why it happens:** The current provider constructor defaults to `process.env.ALPHA_VANTAGE_API_KEY`. [VERIFIED: `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`]  
**How to avoid:** Resolve credentials in a settings/server resolver and pass the selected key explicitly into the provider. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; `01-CONTEXT.md`]  
**Warning signs:** Tests instantiate provider factory without checking persisted-key precedence. [VERIFIED: `.planning/codebase/TESTING.md`]

### Pitfall 2: Leaking Secrets Through "Helpful" Metadata

**What goes wrong:** API responses or UI state include plaintext, ciphertext, IV, auth tag, full URL, or raw provider body. [VERIFIED: `01-CONTEXT.md`; OWASP Secrets Management Cheat Sheet]  
**Why it happens:** CRUD flows often reuse repository rows as response DTOs. [VERIFIED: `.planning/codebase/CONVENTIONS.md`; repository mapping patterns]  
**How to avoid:** Repository rows must be mapped to explicit `SafeProviderApiKeyMetadata` before returning. [VERIFIED: `01-CONTEXT.md`]  
**Warning signs:** Type names like `ProviderApiKeyRecord` appear in component props. [VERIFIED: local component prop patterns]

### Pitfall 3: Missing Encryption Secret Breaks Read Pages

**What goes wrong:** `/settings` tries to decrypt keys during ordinary page load and fails when `PROVIDER_KEYS_ENCRYPTION_SECRET` is missing. [VERIFIED: `01-CONTEXT.md`; environment check]  
**Why it happens:** Safe metadata does not require decryption, but credential resolution and validation do. [VERIFIED: `01-CONTEXT.md`; Node.js crypto docs]  
**How to avoid:** List/read metadata from stored suffix/status without decrypting; decrypt only for create/update validation and provider fetches. [VERIFIED: `01-CONTEXT.md`]  
**Warning signs:** `decryptProviderSecret()` is called inside metadata list methods. [VERIFIED: recommended architecture]

### Pitfall 4: Drizzle Migration Omits Seed Row

**What goes wrong:** `app_settings` exists but the settings page has no singleton row. [VERIFIED: `01-CONTEXT.md`]  
**Why it happens:** Drizzle `generate` creates schema-diff SQL, not necessarily application seed data. [CITED: Drizzle generate docs]  
**How to avoid:** Repository should `getOrCreateSettings()` and the migration should include a reviewed `INSERT ... ON CONFLICT DO NOTHING` default row when practical. [VERIFIED: local repository pattern; `01-CONTEXT.md`]  
**Warning signs:** Tests only cover update after row exists. [VERIFIED: `.planning/codebase/TESTING.md`]

### Pitfall 5: Sample Gate Only Changes Labels

**What goes wrong:** The UI hides sample data, but `/api/market-data` still accepts `source: "sample"`. [VERIFIED: `src/app/api/market-data/route.ts`; `src/components/market-data/market-data-form.tsx`]  
**Why it happens:** Existing market-data validation only checks `marketDataSources`, not settings. [VERIFIED: `src/modules/market-data/domain/market-data-validation.ts`]  
**How to avoid:** The market-data service should consult settings before accepting sample source in normal create paths. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`]  
**Warning signs:** `marketDataSources.map()` renders all sources regardless of settings. [VERIFIED: `src/components/market-data/market-data-form.tsx`]

## Code Examples

Verified patterns from official and local sources follow. [VERIFIED: sources listed inline]

### Provider Registry Descriptor

```typescript
// Source: Phase provider registry decisions and local union style. [VERIFIED: 01-CONTEXT.md; src/modules/market-data/domain/market-data-chunk.ts]
export const providerIds = ["alpha_vantage", "sample", "twelve_data"] as const;

export type ProviderId = (typeof providerIds)[number];

export type ProviderDescriptor = {
  id: ProviderId;
  label: string;
  implementationStatus: "implemented" | "planned" | "demo";
  keyRequirement: "required" | "not_required" | "planned";
  maybeEnvironmentFallbackName?: string;
  supportedIntervals: readonly MarketDataInterval[];
  safeDescription: string;
};
```

### Safe Provider Key Metadata

```typescript
// Source: Phase safe metadata decisions. [VERIFIED: 01-CONTEXT.md]
export type ProviderApiKeyMetadata = {
  providerId: ProviderId;
  providerLabel: string;
  enabled: boolean;
  maskedSuffix: string;
  validationStatus: "not_validated" | "valid" | "invalid";
  validationMessage: string | null;
  lastValidatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
```

### Credential Resolution Result

```typescript
// Source: persisted-key precedence and env fallback decisions. [VERIFIED: 01-CONTEXT.md]
export type ProviderCredentialResolution =
  | {
      kind: "persisted";
      apiKey: string;
    }
  | {
      kind: "environment";
      apiKey: string;
    }
  | {
      kind: "missing";
      message: string;
    };
```

### Sanitized Validation Result

```typescript
// Source: explicit safe validation decisions and Alpha Vantage provider tests. [VERIFIED: 01-CONTEXT.md; test/market-data/alpha-vantage-market-data-provider.test.ts]
export type ProviderKeyValidationResult =
  | {
      ok: true;
      status: "valid";
      message: "Provider key validated.";
      validatedAt: Date;
    }
  | {
      ok: false;
      status: "invalid";
      message: string;
      validatedAt: Date;
    };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Provider keys only in `ALPHA_VANTAGE_API_KEY`. [VERIFIED: `.env.example`; `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`] | Encrypted persisted provider key with `ALPHA_VANTAGE_API_KEY` read-only fallback. [VERIFIED: `01-CONTEXT.md`] | Phase 1 plan. [VERIFIED: `.planning/ROADMAP.md`] | Settings UI can manage keys without exposing raw values. [VERIFIED: `.planning/REQUIREMENTS.md`] |
| `MARKET_DATA_SOURCE` chooses sample/stored backtest provider. [VERIFIED: `src/modules/backtests/server/service-singleton.ts`] | Persist settings now, but defer full backtest fetch lifecycle to Phase 3. [VERIFIED: `01-CONTEXT.md`; `.planning/ROADMAP.md`] | Phase 1 stores setting; Phase 3 executes behavior. [VERIFIED: `.planning/ROADMAP.md`] | Avoids implementing silent fetch/progress too early. [VERIFIED: `01-CONTEXT.md`] |
| UI source list renders all `marketDataSources`. [VERIFIED: `src/components/market-data/market-data-form.tsx`] | Use registry plus `showSampleData` to gate sample/demo visibility. [VERIFIED: `01-CONTEXT.md`] | Phase 1 plan. [VERIFIED: `.planning/ROADMAP.md`] | Normal real-data flows stop presenting sample data as a default path. [VERIFIED: `.planning/REQUIREMENTS.md`] |

**Deprecated/outdated:**

- Treating Alpha Vantage as only env-configured is outdated for this milestone because KEY-01 through KEY-05 require persisted key CRUD and precedence. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`]
- Treating sample data as an always-visible source is outdated for this milestone because SET-04 and DATA-06 require explicit demo/development gates. [VERIFIED: `.planning/REQUIREMENTS.md`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|

All claims in this research were verified or cited; no user confirmation is needed before planning. [VERIFIED: source audit in this file]

## Open Questions

1. **None blocking.** The phase decisions already lock the provider, settings, encryption helper, key precedence, validation action, and UI scope. [VERIFIED: `01-CONTEXT.md`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Bun | Scripts, tests, migration generation | Partial | Local `1.3.9`; repo pins `1.3.13`. [VERIFIED: `bun --version`; `package.json`] | Upgrade local Bun or run in Docker/image with pinned Bun before implementation verification. [VERIFIED: `Dockerfile`; `package.json`] |
| Node.js | `node:crypto` docs/runtime parity and npm checks | Yes | `v24.13.0`. [VERIFIED: `node --version`] | Bun runtime should still be the script runner. [VERIFIED: `package.json`] |
| PostgreSQL | Drizzle migrations/repositories | Yes | `pg_isready` reports accepting connections on `/tmp:5432`. [VERIFIED: `pg_isready`] | Docker Compose Postgres if local socket DB is not the intended target. [VERIFIED: `docker-compose.yml`] |
| Docker | Local full-stack fallback | Yes | Docker `29.3.1`. [VERIFIED: `docker --version`; `docker info`] | Local Postgres plus Bun scripts. [VERIFIED: `README.md`] |
| `PROVIDER_KEYS_ENCRYPTION_SECRET` | Saved-key create/update/decrypt | No | Missing in current shell and `.env.example`. [VERIFIED: environment check; `.env.example`] | Environment fallback for Alpha Vantage can still work when no saved key is needed. [VERIFIED: `01-CONTEXT.md`] |
| `ALPHA_VANTAGE_API_KEY` | Migration fallback and live provider validation | No | Missing in current shell. [VERIFIED: environment check] | Tests must use injected fake fetch/key; live validation needs an admin-provided key. [VERIFIED: `.planning/codebase/TESTING.md`; `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`] |

**Missing dependencies with no fallback:**

- `PROVIDER_KEYS_ENCRYPTION_SECRET` blocks saved-key create/update/decrypt behavior until configured. [VERIFIED: `01-CONTEXT.md`; environment check]

**Missing dependencies with fallback:**

- Local Bun is below the repo pin, but Docker uses `oven/bun:1.3.13` and the planner can include a local Bun upgrade or containerized verification step. [VERIFIED: `bun --version`; `Dockerfile`; `package.json`]
- `ALPHA_VANTAGE_API_KEY` is missing locally, but tests should mock provider fetch and the app can show fallback unavailable. [VERIFIED: environment check; `.planning/codebase/TESTING.md`]

## Security Domain

Security enforcement is enabled because `.planning/config.json` does not set `security_enforcement` to `false`. [VERIFIED: `.planning/config.json`]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No for v1 implementation | Single-admin/no-auth is an explicit milestone constraint; document public deployment risk. [VERIFIED: `AGENTS.md`; `.planning/REQUIREMENTS.md`; `.planning/codebase/CONCERNS.md`] |
| V3 Session Management | No for v1 implementation | No session layer is present or planned for Phase 1. [VERIFIED: `.planning/codebase/CONCERNS.md`; `01-CONTEXT.md`] |
| V4 Access Control | Limited | Keep single-admin assumption explicit; do not add account/team abstractions. [VERIFIED: `01-CONTEXT.md`; OWASP ASVS project overview] |
| V5 Input Validation | Yes | Zod parsers for settings and key actions; reject unsupported provider ids and sample source when hidden. [VERIFIED: `.planning/codebase/CONVENTIONS.md`; `.planning/REQUIREMENTS.md`] |
| V6 Cryptography | Yes | `node:crypto` AES-256-GCM, 32-byte secret, random IV, 16-byte auth tag, no custom algorithms. [VERIFIED: `01-CONTEXT.md`; Node.js crypto docs; OWASP Cryptographic Storage Cheat Sheet] |
| Error Handling | Yes | Map provider and crypto failures to safe messages/codes before browser responses. [VERIFIED: `01-CONTEXT.md`; `.planning/codebase/CONCERNS.md`] |
| Data Protection | Yes | Return only safe key metadata; keep plaintext and encrypted material server-only. [VERIFIED: `01-CONTEXT.md`; Next.js environment docs] |

### Known Threat Patterns for Next.js Settings and Provider Keys

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Raw provider key leaked to browser | Information Disclosure | Never include plaintext, ciphertext, IV, auth tag, or full request URL in DTOs. [VERIFIED: `01-CONTEXT.md`; Next.js environment docs] |
| Key table dump exposes usable secrets | Information Disclosure | Encrypt at application layer and keep encryption secret outside DB and source control. [VERIFIED: OWASP Cryptographic Storage Cheat Sheet] |
| Missing encryption secret causes unsafe fallback | Tampering/Information Disclosure | Fail closed for saved-key create/update/decrypt; allow env fallback only when no saved key is required. [VERIFIED: `01-CONTEXT.md`] |
| Disabled key still used for fetch | Elevation of Privilege | Credential resolver must require `enabled=true` for persisted keys. [VERIFIED: `01-CONTEXT.md`] |
| Provider error includes raw URL/key | Information Disclosure | Validation/fetch services must sanitize errors and avoid returning request URLs or provider bodies. [VERIFIED: `01-CONTEXT.md`; `.planning/codebase/CONCERNS.md`] |
| Sample source bypasses UI gate | Tampering | Enforce sample visibility in server service, not just component options. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/app/api/market-data/route.ts`] |
| SQL injection in settings queries | Tampering | Use Drizzle query builder and parameterized expressions through repositories. [VERIFIED: Drizzle PostgreSQL docs; local repository code] |

## Migration and Drizzle Caveats

- Add schema definitions only in `src/modules/db/schema.ts` and generate migrations under `src/modules/db/migrations/`. [VERIFIED: `.planning/codebase/STRUCTURE.md`; `drizzle.config.ts`]
- Run `bun run db:generate` after schema edits; Drizzle Kit generate compares schema snapshots and previous migrations to create SQL and snapshot files. [VERIFIED: `package.json`; Drizzle generate docs]
- Review generated SQL before commit because singleton seed data may need a manual `INSERT INTO app_settings ... ON CONFLICT DO NOTHING`. [VERIFIED: Drizzle generate docs; `01-CONTEXT.md`]
- Prefer `text` plus registry validation for provider ids if the planner wants `twelve_data` descriptors without a Phase 4 enum migration; prefer `pgEnum` only if the planner accepts a migration when provider ids change. [VERIFIED: `01-CONTEXT.md`; `src/modules/db/schema.ts`; Drizzle indexes/constraints docs]
- Add a unique constraint or unique index on `provider_api_keys.provider_id` to enforce one saved key per provider. [VERIFIED: `01-CONTEXT.md`; Drizzle unique constraints docs]
- Do not store `PROVIDER_KEYS_ENCRYPTION_SECRET` or any API key value in migration files, snapshots, README examples, or `.env.example`. [VERIFIED: Next.js environment docs; OWASP Cryptographic Storage Cheat Sheet]

## Tests and Verification Plan

- Add `test/settings/app-settings.test.ts` for default settings, missing-data behavior parsing, and sample visibility gating. [VERIFIED: `.planning/codebase/TESTING.md`; `01-CONTEXT.md`]
- Add `test/settings/provider-registry.test.ts` for Alpha Vantage implemented status, sample demo status, and optional Twelve Data planned/disabled status. [VERIFIED: `01-CONTEXT.md`]
- Add `test/settings/provider-key-encryption.test.ts` for AES-GCM round trip, wrong secret failure, missing secret failure, and auth-tag tamper failure. [VERIFIED: Node.js crypto docs; `.planning/codebase/TESTING.md`]
- Add `test/settings/provider-api-key-service.test.ts` for create/update/delete/disable metadata behavior and no plaintext in returned objects. [VERIFIED: `.planning/REQUIREMENTS.md`; `01-CONTEXT.md`]
- Add `test/settings/provider-credential-resolver.test.ts` for persisted key precedence, disabled-key skip, missing encryption secret failure, and `ALPHA_VANTAGE_API_KEY` fallback. [VERIFIED: `01-CONTEXT.md`]
- Add or update `test/market-data/alpha-vantage-market-data-provider.test.ts` so Alpha Vantage accepts explicit injected keys and request tests do not expose raw keys in thrown UI-facing errors. [VERIFIED: existing Alpha Vantage tests; `01-CONTEXT.md`]
- Add a focused service test for sample source rejection when `showSampleData=false`, with an injected settings service/repository fake. [VERIFIED: `.planning/REQUIREMENTS.md`; `src/modules/market-data/server/market-data-service.ts`]
- Run `bun run test` for focused behavior and `bun run verify` before implementation commits. [VERIFIED: `package.json`; `AGENTS.md`]

## Sources

### Primary (HIGH confidence)

- `.planning/phases/01-provider-settings-and-secrets/01-CONTEXT.md` - locked Phase 1 decisions, discretion areas, and deferred scope. [VERIFIED: file read]
- `.planning/REQUIREMENTS.md` - SET-01 through SET-04 and KEY-01 through KEY-05. [VERIFIED: file read]
- `.planning/ROADMAP.md` - Phase 1 success criteria and later-phase boundaries. [VERIFIED: file read]
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md` - local codebase patterns and risks. [VERIFIED: file read]
- `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`, and pinned Bright Builds standards for architecture, code shape, verification, testing, and TypeScript/JavaScript. [VERIFIED: file read and curl from pinned commit]
- `package.json`, `bun.lock`, `src/modules/db/schema.ts`, `src/modules/market-data/server/*.ts`, `src/components/ui/*.tsx`, `src/app/**` - current local implementation. [VERIFIED: codebase inspection]
- Node.js crypto docs - AES-GCM `createCipheriv`, IV guidance, auth-tag behavior. [CITED: https://nodejs.org/api/crypto.html]
- OWASP Cryptographic Storage Cheat Sheet - AES, authenticated modes, CSPRNG, key storage guidance. [CITED: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html]
- Next.js environment variables docs - non-`NEXT_PUBLIC_` server-only env behavior and browser bundling warning. [CITED: https://nextjs.org/docs/app/guides/environment-variables]
- Next.js route handlers docs - `route.ts` convention and HTTP method exports. [CITED: https://nextjs.org/docs/app/getting-started/route-handlers]
- Drizzle ORM PostgreSQL and migration docs - PostgreSQL support, unique constraints, and `drizzle-kit generate`. [CITED: https://orm.drizzle.team/docs/get-started-postgresql; https://orm.drizzle.team/docs/indexes-constraints; https://orm.drizzle.team/docs/drizzle-kit-generate]
- Alpha Vantage official documentation and premium page - daily endpoint shape and free request limit context. [CITED: https://www.alphavantage.co/documentation/; https://www.alphavantage.co/premium/]

### Secondary (MEDIUM confidence)

- Magic UI installation and Magic Card docs/source - shadcn-style installation and optional Magic Card dependency surface. [CITED: https://magicui.design/docs/installation; https://magicui.design/docs/components/magic-card; https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/magic-card.tsx]
- npm registry checks for current package versions. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- None. [VERIFIED: source audit]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Existing repo stack, lockfile, npm registry, and official docs were checked. [VERIFIED: `package.json`; `bun.lock`; npm registry; official docs]
- Architecture: HIGH - Recommendations follow existing feature-module, service-factory, repository, and App Router patterns. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`; source files]
- Secret storage: HIGH - User locked AES-GCM, and Node/OWASP docs support the helper shape. [VERIFIED: `01-CONTEXT.md`; Node.js crypto docs; OWASP Cryptographic Storage Cheat Sheet]
- UI/Magic UI: MEDIUM-HIGH - Phase scope prefers existing primitives; optional Magic UI dependency details are verified, but adoption remains discretionary. [VERIFIED: `01-CONTEXT.md`; Magic UI docs]
- Environment: MEDIUM - Local Bun version is below the repo pin, but PostgreSQL, Docker, Node, and npm checks are available. [VERIFIED: environment commands]

**Research date:** 2026-04-26  
**Valid until:** 2026-05-26 for local architecture and schema guidance; recheck package versions and provider docs after 7 days before adding dependencies or changing provider validation behavior. [VERIFIED: npm registry timestamps; Alpha Vantage docs are live external docs]
