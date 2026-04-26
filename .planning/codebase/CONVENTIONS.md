# Coding Conventions

**Analysis Date:** 2026-04-26

## Naming Patterns

**Files:**

- Use kebab-case for source files under domain, server, component, and config areas: `src/modules/market-data/domain/candle-series.ts`, `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `src/components/app-shell/provenance-footer.tsx`.
- Use Next.js App Router filenames for routes and pages: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/api/backtests/[id]/route.ts`, `src/app/market-data/[id]/page.tsx`.
- Use `.test.ts` for tests in the top-level `test/` tree: `test/market-data/candle-series.test.ts`, `test/backtests/domain/backtest-domain.test.ts`.

**Functions:**

- Use `camelCase` for ordinary functions and helpers: `normalizeTicker` in `src/modules/market-data/domain/market-data-chunk.ts`, `orderNotionalValue` in `src/modules/backtests/domain/backtest-definition.ts`, `sortCandlesAscending` in `src/modules/market-data/domain/candle-series.ts`.
- Prefix functions returning nullable or absence-like success values with `maybe`: `maybeDatabaseUrl` in `src/modules/db/client.ts`, `maybeApiMessage` in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`, `maybeParseMarketDataChunk` in `src/modules/market-data/domain/market-data-validation.ts`.
- Use `get...OrThrow` names for helpers that enforce required runtime state by throwing: `getPostgresPoolOrThrow` and `getDbOrThrow` in `src/modules/db/client.ts`.
- Use PascalCase for React component functions: `BacktestForm` in `src/components/backtests/backtest-form.tsx`, `DataTable` in `src/components/ui/data-table.tsx`, `ProvenanceFooter` in `src/components/app-shell/provenance-footer.tsx`.
- Use uppercase HTTP method exports for Next route handlers: `GET`, `POST`, `PUT`, and `DELETE` in `src/app/api/backtests/[id]/route.ts`.

**Variables:**

- Use `camelCase` for locals and module constants: `defaultEngineVersion` in `src/modules/backtests/server/backtest-service.ts`, `alphaVantageDailySeriesKey` in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.
- Prefix nullable locals, parameters, fields, and props with `maybe`: `maybeBacktest` in `src/modules/backtests/server/backtest-service.ts`, `maybeClassName` in `src/components/ui/shell.tsx`, `maybeDefinition` in `src/components/backtests/backtest-form.tsx`.
- Use plural names for enum-like readonly arrays: `orderSizeModes` and `fillPolicies` in `src/modules/backtests/domain/backtest-definition.ts`, `marketDataSources` and `marketDataIntervals` in `src/modules/market-data/domain/market-data-chunk.ts`.

**Types:**

- Use PascalCase `type` aliases for domain records, props, dependencies, and result shapes: `BacktestDefinitionDraft` in `src/modules/backtests/domain/backtest-definition.ts`, `MarketDataServiceDependencies` in `src/modules/market-data/server/market-data-service.ts`, `BacktestFormProps` in `src/components/backtests/backtest-form.tsx`.
- Prefer `type` aliases over `interface`; no project-owned `interface` declarations are detected in `src/`.
- Model controlled operation results as discriminated unions with `ok: true` and `ok: false`: `ParsedBacktestDefinitionResult` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `CreateMarketDataChunkResult` in `src/modules/market-data/server/market-data-service.ts`.
- Derive union types from `as const` arrays: `OrderSizeMode` and `FillPolicy` in `src/modules/backtests/domain/backtest-definition.ts`, `MarketDataSource` and `MarketDataInterval` in `src/modules/market-data/domain/market-data-chunk.ts`.

## Code Style

**Formatting:**

- Use the existing TypeScript style: 2-space indentation, double quotes, semicolons, trailing commas in multiline structures, and explicit return types on exported functions where the surrounding file does so.
- No Prettier, Biome, or `.editorconfig` configuration is detected. Use the observed style in `src/modules/market-data/domain/market-data-validation.ts`, `src/modules/backtests/server/backtest-service.ts`, and `src/components/ui/data-table.tsx`.
- Numeric literals may use separators for readability: `10_000` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `1_000` in `src/modules/market-data/domain/market-data-chunk.ts`.

**Linting:**

- Use ESLint through `bun run lint`, defined as `eslint .` in `package.json`.
- ESLint is configured in `eslint.config.mjs` with `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`, and global ignores for `.next/**`, `coverage/**`, `dist/**`, `drizzle/**`, and `next-env.d.ts`.
- TypeScript is strict in `tsconfig.json`; keep `allowJs: false`, `strict: true`, `isolatedModules: true`, and `noEmit: true` assumptions intact.

## Import Organization

**Order:**

1. File directives first: `"use client";` in client components such as `src/components/backtests/backtest-form.tsx`, or `import "server-only";` in server-only modules such as `src/modules/backtests/server/backtest-service.ts`.
2. Node, framework, and third-party imports next: `node:path` and `vitest/config` in `vitest.config.ts`, `next/server` in `src/app/api/market-data/route.ts`, `zod` in `src/modules/market-data/domain/market-data-validation.ts`.
3. Internal imports after a blank line, using the `@/` alias: `@/modules/backtests/domain/run-ladder-backtest` in `src/modules/backtests/server/backtest-service.ts`.
4. Prefer type-only imports with `import type` or inline `type` specifiers: `import type { Candle }` in `src/modules/market-data/domain/market-data-chunk.ts`, `import { DataTable, type DataTableColumn }` in `src/app/page.tsx`.

**Path Aliases:**

- Use `@/*` for code under `src/*`, configured in `tsconfig.json` and mirrored in `vitest.config.ts`.
- Avoid long relative imports inside `src/`; the main relative import exception is `../../../package.json` in `src/modules/build-info/build-info.ts`.

## Error Handling

**Patterns:**

- Parse untrusted form input with Zod at boundaries, then return typed result unions rather than throwing validation errors: `maybeParseBacktestDefinition` in `src/modules/backtests/domain/maybe-parse-backtest-definition.ts`, `maybeParseMarketDataChunk` in `src/modules/market-data/domain/market-data-validation.ts`.
- Use early returns for invalid or absent paths before the main behavior: `getPostgresPool` in `src/modules/db/client.ts`, `createChunk` in `src/modules/market-data/server/market-data-service.ts`, route handlers in `src/app/api/backtests/[id]/route.ts`.
- Throw explicit `Error` objects for operational failures, malformed external data, and required runtime state: `parseAlphaVantageDailyCandles` in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`, `candlesFromJson` in `src/modules/market-data/server/market-data-chunk-repository.ts`, `runLadderBacktest` in `src/modules/backtests/domain/run-ladder-backtest.ts`.
- Catch provider and engine failures at service boundaries and convert them into user-facing result objects: `runBacktest` in `src/modules/backtests/server/backtest-service.ts`, `createChunk` in `src/modules/market-data/server/market-data-service.ts`.
- Map service results to HTTP responses in App Router handlers: return `400` for validation failures in `src/app/api/market-data/route.ts`, return `404` for missing resources in `src/app/api/backtests/[id]/route.ts`, return `201` for creation in `src/app/api/market-data/route.ts`.

## Logging

**Framework:** console

**Patterns:**

- Do not add broad application logging by default; no logging wrapper or observability SDK is detected in `src/`.
- Use `console.error` only for command-line script failure reporting, as in `src/modules/db/migrate.ts`, where the top-level `main()` catch logs the migration failure and sets `process.exitCode = 1`.
- For request, domain, and service failures, return structured errors or throw explicit `Error` objects instead of logging and continuing silently: `src/modules/backtests/server/backtest-service.ts`, `src/modules/market-data/server/market-data-service.ts`.

## Comments

**When to Comment:**

- Production code is largely self-documenting; add comments only for non-obvious intent, not for restating simple assignments.
- Tests use explicit Arrange, Act, and Assert comments consistently: `test/market-data/market-data-validation.test.ts`, `test/backtests/domain/backtest-domain.test.ts`, `test/market-data/alpha-vantage-market-data-provider.test.ts`.

**JSDoc/TSDoc:**

- JSDoc/TSDoc is not used in `src/`. Prefer clear type aliases and function names over documentation comments unless adding a public API with behavior that is not obvious from the type.

## Function Design

**Size:** Keep helpers focused and extract named functions when validation, mapping, or formatting logic grows. Domain modules use small helpers around the exported workflow, such as `parseDate` and `fieldErrorsFromZodError` in `src/modules/market-data/domain/market-data-validation.ts`, and `numberFromAlphaVantageValue` and `candleFromDailyEntry` in `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.

**Parameters:** Prefer structured object parameters when a function accepts several related values: `createBidLevels` in `src/modules/backtests/domain/ladder-level.ts`, `calculateBacktestMetrics` in `src/modules/backtests/domain/metrics.ts`, `createBacktestService` in `src/modules/backtests/server/backtest-service.ts`.

**Return Values:** Prefer explicit domain return shapes:

- Use arrays for pure transformations: `sortCandlesAscending` and `filterCandlesByDateRange` in `src/modules/market-data/domain/candle-series.ts`.
- Use discriminated unions for expected success/failure flows: `ParsedMarketDataChunkResult` in `src/modules/market-data/domain/market-data-validation.ts`.
- Use `null` for missing records and name the callsite variable with `maybe`: `getBacktest` in `src/modules/backtests/server/backtest-service.ts`, `getChunk` in `src/modules/market-data/server/market-data-service.ts`.
- Use thrown errors for invariant failures or external-service failures that callers should catch at service or test boundaries: `src/modules/market-data/server/alpha-vantage-market-data-provider.ts`.

## Module Design

**Exports:** Use named exports for reusable domain, service, repository, and UI modules: `src/modules/market-data/domain/candle-series.ts`, `src/modules/backtests/server/backtest-service.ts`, `src/components/ui/stat-card.tsx`. Use default exports for Next.js route-owned files and pages only: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/backtests/page.tsx`.

**Barrel Files:** Barrel files are not used. Import directly from the owning module path, such as `@/modules/market-data/domain/candle-series` and `@/components/ui/data-table`.

**Server/Client Boundaries:**

- Server-only modules must start with `import "server-only";`: `src/modules/backtests/server/backtest-repository.ts`, `src/modules/market-data/server/service-singleton.ts`, `src/modules/build-info/build-info.ts`.
- Interactive React components must start with `"use client";`: `src/components/backtests/backtest-form.tsx`, `src/components/market-data/market-data-form.tsx`, `src/components/charts/backtest-result-charts.tsx`.
- Keep business logic in `src/modules/**/domain/` as data-in, data-out functions, and keep Next.js, database, and fetch orchestration in `src/app/**` and `src/modules/**/server/`.

---

_Convention analysis: 2026-04-26_
