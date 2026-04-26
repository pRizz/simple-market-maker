# Testing Patterns

**Analysis Date:** 2026-04-26

## Test Framework

**Runner:**

- Vitest 3.2.4, declared in `package.json`.
- Config: `vitest.config.ts`.
- Test environment: `node`, configured in `vitest.config.ts`.
- Included files: `test/**/*.test.ts`, configured in `vitest.config.ts`.
- Path alias support: `@` resolves to `./src` in `vitest.config.ts`.

**Assertion Library:**

- Vitest `expect`, imported from `vitest` in every test file: `test/market-data/candle-series.test.ts`, `test/backtests/domain/backtest-domain.test.ts`, `test/market-data/alpha-vantage-market-data-provider.test.ts`.
- Vitest `vi` is used for mocks and spies where needed: `test/market-data/alpha-vantage-market-data-provider.test.ts`, `test/market-data/stored-market-data-provider.test.ts`.

**Run Commands:**

```bash
bun run test        # Run all tests with vitest run
bun run test:watch  # Run Vitest watch mode
bun run verify      # Run lint, typecheck, tests, and Next build
```

## Test File Organization

**Location:**

- Tests live in the top-level `test/` directory, separate from `src/`.
- Organize tests by feature or layer: `test/market-data/`, `test/backtests/domain/`.
- Domain tests may use a nested domain directory: `test/backtests/domain/backtest-domain.test.ts`.

**Naming:**

- Use `<subject>.test.ts`: `test/market-data/market-data-validation.test.ts`, `test/market-data/alpha-vantage-market-data-provider.test.ts`, `test/market-data/stored-market-data-provider.test.ts`.
- Test suite names should match the function, helper group, or provider under test: `describe("maybeParseMarketDataChunk", ...)` in `test/market-data/market-data-validation.test.ts`, `describe("AlphaVantageMarketDataProvider", ...)` in `test/market-data/alpha-vantage-market-data-provider.test.ts`.

**Structure:**

```text
test/
|-- backtests/
|   `-- domain/
|       `-- backtest-domain.test.ts
`-- market-data/
    |-- alpha-vantage-market-data-provider.test.ts
    |-- candle-series.test.ts
    |-- market-data-validation.test.ts
    `-- stored-market-data-provider.test.ts
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, expect, it } from "vitest";

import { maybeParseMarketDataChunk } from "@/modules/market-data/domain/market-data-validation";

describe("maybeParseMarketDataChunk", () => {
  it("rejects an end date before the start date", () => {
    // Arrange
    const rawInput = {
      ticker: "AAPL",
      source: "sample",
      interval: "daily",
      startDate: "2024-02-01",
      endDate: "2024-01-01",
      notes: "",
    };

    // Act
    const result = maybeParseMarketDataChunk(rawInput);

    // Assert
    expect(result.ok).toBe(false);
  });
});
```

**Patterns:**

- Use `describe` for the subject and `it` for one behavior: `test/market-data/candle-series.test.ts`, `test/backtests/domain/backtest-domain.test.ts`.
- Use explicit `// Arrange`, `// Act`, and `// Assert` comments. Combined `// Act / Assert` is used for direct throw assertions in `test/backtests/domain/backtest-domain.test.ts` and async rejection assertions in `test/market-data/alpha-vantage-market-data-provider.test.ts`.
- Narrow discriminated unions before accessing success or failure fields by checking `result.ok` and throwing a test-only error on the impossible branch: `test/market-data/market-data-validation.test.ts`, `test/backtests/domain/backtest-domain.test.ts`.
- Keep fixed dates as explicit UTC `Date` objects or `YYYY-MM-DD` strings so behavior is deterministic: `test/market-data/candle-series.test.ts`, `test/market-data/stored-market-data-provider.test.ts`.

## Mocking

**Framework:** Vitest `vi`

**Patterns:**

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

beforeEach(async () => {
  // Arrange
  const providerModule =
    await import("@/modules/backtests/server/stored-market-data-provider");
  StoredMarketDataProvider = providerModule.StoredMarketDataProvider;
});
```

```typescript
const fetchFn = vi.fn(successfulFetch(dailySeriesBody()));
const provider = new AlphaVantageMarketDataProvider({
  apiKey: "demo-key",
  fetchFn,
});
```

**What to Mock:**

- Mock the `server-only` package when a Node test imports a server-only module directly: `test/market-data/stored-market-data-provider.test.ts`.
- Mock fetch-like external service boundaries with injected functions: `FetchLike` and `fetchFn` in `test/market-data/alpha-vantage-market-data-provider.test.ts`.
- Use lightweight repository/provider fakes through dependency injection rather than global mocks: `findMatchingChunk: async () => chunkRecord()` in `test/market-data/stored-market-data-provider.test.ts`.

**What NOT to Mock:**

- Do not mock pure domain helpers; call them with plain data: `sortCandlesAscending`, `filterCandlesByDateRange`, `summarizeCandles`, and `toPriceSeriesPoints` in `test/market-data/candle-series.test.ts`.
- Do not mock Zod validation internals; pass raw input to parser functions: `maybeParseBacktestDefinition` in `test/backtests/domain/backtest-domain.test.ts`, `maybeParseMarketDataChunk` in `test/market-data/market-data-validation.test.ts`.
- Do not call real external APIs or require live database credentials in unit tests. Use injected fetch functions or repository fakes as shown in `test/market-data/alpha-vantage-market-data-provider.test.ts` and `test/market-data/stored-market-data-provider.test.ts`.

## Fixtures and Factories

**Test Data:**

```typescript
const unsortedCandles: Candle[] = [
  {
    occurredAt: new Date("2024-01-03T00:00:00.000Z"),
    open: 104,
    high: 108,
    low: 103,
    close: 107,
    volume: 300,
  },
];
```

```typescript
function providerForBody(body: unknown): AlphaVantageMarketDataProvider {
  return new AlphaVantageMarketDataProvider({
    apiKey: "demo",
    fetchFn: successfulFetch(body),
  });
}
```

**Location:**

- Keep fixtures close to the tests that use them: `unsortedCandles` in `test/market-data/candle-series.test.ts`, `baseDefinition` and `chunkRecord` in `test/market-data/stored-market-data-provider.test.ts`, `dailySeriesBody` in `test/market-data/alpha-vantage-market-data-provider.test.ts`.
- Prefer small fixture helpers over shared global fixture files until data is reused across multiple test files.

## Coverage

**Requirements:** None enforced. No coverage thresholds or coverage script are detected in `package.json` or `vitest.config.ts`.

**View Coverage:**

```bash
# Not detected: no coverage command is defined in package.json
```

## Test Types

**Unit Tests:**

- Pure domain logic tests cover parser validation, normalization, candle sorting/filtering/summarizing, ladder level construction, and simulation behavior: `test/market-data/market-data-validation.test.ts`, `test/market-data/candle-series.test.ts`, `test/backtests/domain/backtest-domain.test.ts`.
- Provider unit tests cover external response parsing and request construction with injected dependencies: `test/market-data/alpha-vantage-market-data-provider.test.ts`.
- Server-adapter unit tests use repository fakes for stored market data behavior: `test/market-data/stored-market-data-provider.test.ts`.

**Integration Tests:**

- Not detected. No tests exercise Next.js route handlers, Drizzle repositories, or a real PostgreSQL database. Route files include `src/app/api/market-data/route.ts`, `src/app/api/backtests/[id]/route.ts`; repository files include `src/modules/market-data/server/market-data-chunk-repository.ts`, `src/modules/backtests/server/backtest-repository.ts`.

**E2E Tests:**

- Not used. No Playwright, Cypress, or browser E2E config is detected in `package.json` or the repository root.

**Component Tests:**

- Not detected. `@testing-library/react` and `jsdom` are dependencies in `package.json`, but `vitest.config.ts` uses `environment: "node"` and no `.tsx` test files are present.

## Common Patterns

**Async Testing:**

```typescript
it("handles API error messages", async () => {
  // Arrange
  const provider = providerForBody({
    "Error Message": "Invalid API call.",
  });

  // Act / Assert
  await expect(
    provider.fetchCandles({
      ticker: "BAD",
      interval: "daily",
      startDate: new Date("2024-01-01T00:00:00.000Z"),
      endDate: new Date("2024-01-05T00:00:00.000Z"),
    }),
  ).rejects.toThrow("Alpha Vantage rejected the request");
});
```

**Error Testing:**

```typescript
it("throws when no candles are provided", () => {
  // Arrange
  const definition = {
    name: "No data",
    ticker: "AAPL",
    startDate: new Date("2024-01-01T00:00:00.000Z"),
    endDate: new Date("2024-01-02T00:00:00.000Z"),
    startingCapital: 10_000,
    incrementPercent: 2,
    bidLevels: 1,
    askLevels: 1,
    orderSizeMode: "fixed_amount" as const,
    orderSizeValue: 1_000,
    maxPositionValue: 5_000,
    feesBps: 0,
    slippageBps: 0,
    fillPolicy: "buy-first" as const,
    notes: "",
  };

  // Act / Assert
  expect(() => runLadderBacktest(definition, [])).toThrow(
    "Backtests require at least one candle.",
  );
});
```

**Verification Commands:**

- Use `bun run verify` as the repo-owned aggregate command from `package.json` and `README.md`.
- Use narrower commands when the change only needs one surface: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.

---

_Testing analysis: 2026-04-26_
