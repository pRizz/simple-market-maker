import { describe, expect, it, vi } from "vitest";

import type { Candle } from "@/modules/backtests/domain/candle";
import type {
  MarketDataChunkDraft,
  MarketDataChunkRecord,
  MarketDataSource,
} from "@/modules/market-data/domain/market-data-chunk";
import { createMarketDataService } from "@/modules/market-data/server/market-data-service";
import type { MarketDataFetchProvider } from "@/modules/market-data/server/market-data-provider";
import type { AppSettings } from "@/modules/settings/domain/app-settings";

vi.mock("server-only", () => ({}));

const defaultSettings: AppSettings = {
  defaultProvider: "alpha_vantage",
  missingDataBehavior: "confirm_before_fetch",
  showSampleData: false,
};

function inputForSource(source: MarketDataSource) {
  return {
    ticker: "msft",
    source,
    interval: "daily",
    startDate: "2024-01-02",
    endDate: "2024-01-03",
    notes: "",
  };
}

function candle(overrides: Partial<Candle> = {}): Candle {
  return {
    occurredAt: new Date("2024-01-02T00:00:00.000Z"),
    open: 101,
    high: 104,
    low: 100,
    close: 103,
    volume: 2_000,
    ...overrides,
  };
}

function chunkRecord(input: {
  candles: Candle[];
  draft: MarketDataChunkDraft;
  fetchedAt: Date;
}): MarketDataChunkRecord {
  return {
    id: "chunk-1",
    ...input.draft,
    candleCount: input.candles.length,
    candles: input.candles,
    fetchedAt: input.fetchedAt,
    createdAt: input.fetchedAt,
    updatedAt: input.fetchedAt,
  };
}

function createRepository() {
  return {
    createChunk: vi.fn(async (input: {
      candles: Candle[];
      draft: MarketDataChunkDraft;
      fetchedAt: Date;
    }) => chunkRecord(input)),
    deleteChunk: vi.fn(async () => true),
    findMatchingChunk: vi.fn(async () => null),
    getChunkById: vi.fn(async () => null),
    listChunks: vi.fn(async () => []),
  };
}

function createSettingsService(settings: AppSettings) {
  return {
    getSettings: vi.fn(async () => ({
      ok: true as const,
      value: settings,
    })),
  };
}

function createProvider(
  source: MarketDataSource,
  fetchCandles: MarketDataFetchProvider["fetchCandles"],
): MarketDataFetchProvider {
  return {
    source,
    fetchCandles,
  };
}

describe("market data service", () => {
  it("rejects sample chunks before provider construction when sample data is hidden", async () => {
    // Arrange
    const repository = createRepository();
    const providerFactory = vi.fn(async () =>
      createProvider("sample", async () => [candle()]),
    );
    const service = createMarketDataService({
      marketDataChunkRepository: repository,
      providerFactory,
      settingsService: createSettingsService({
        ...defaultSettings,
        showSampleData: false,
      }),
    });

    // Act
    const result = await service.createChunk(inputForSource("sample"));

    // Assert
    expect(result).toEqual({
      ok: false,
      fieldErrors: {},
      formErrors: ["Sample data is disabled in settings."],
    });
    expect(providerFactory).not.toHaveBeenCalled();
    expect(repository.createChunk).not.toHaveBeenCalled();
  });

  it("uses the sample provider when sample data is visible", async () => {
    // Arrange
    const repository = createRepository();
    const providerFactory = vi.fn(async () =>
      createProvider("sample", async () => [candle()]),
    );
    const service = createMarketDataService({
      marketDataChunkRepository: repository,
      providerFactory,
      settingsService: createSettingsService({
        ...defaultSettings,
        showSampleData: true,
      }),
    });

    // Act
    const result = await service.createChunk(inputForSource("sample"));

    // Assert
    if (!result.ok) {
      throw new Error(`Expected sample chunk creation to succeed: ${result.formErrors.join(", ")}`);
    }
    expect(providerFactory).toHaveBeenCalledWith("sample");
    expect(repository.createChunk).toHaveBeenCalledTimes(1);
    expect(result.chunk.source).toBe("sample");
  });

  it("awaits async provider construction for Alpha Vantage chunks", async () => {
    // Arrange
    const repository = createRepository();
    const providerFactory = vi.fn(async () =>
      createProvider("alpha_vantage", async () => [candle()]),
    );
    const service = createMarketDataService({
      marketDataChunkRepository: repository,
      providerFactory,
      settingsService: createSettingsService(defaultSettings),
    });

    // Act
    const result = await service.createChunk(inputForSource("alpha_vantage"));

    // Assert
    expect(result.ok).toBe(true);
    expect(providerFactory).toHaveBeenCalledWith("alpha_vantage");
    expect(repository.createChunk).toHaveBeenCalledTimes(1);
  });

  it("sanitizes provider failures before returning form errors", async () => {
    // Arrange
    const rawKey = "raw-test-key";
    const repository = createRepository();
    const providerFactory = vi.fn(async () =>
      createProvider("alpha_vantage", async () => {
        throw new Error(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&apikey=${rawKey} responseBody={"Note":"premium key required"}`,
        );
      }),
    );
    const service = createMarketDataService({
      marketDataChunkRepository: repository,
      providerFactory,
      settingsService: createSettingsService(defaultSettings),
    });

    // Act
    const result = await service.createChunk(inputForSource("alpha_vantage"));

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected provider failure to return form errors.");
    }
    const serializedErrors = result.formErrors.join(" ");
    expect(serializedErrors).toBe("The provider rejected the saved key.");
    expect(serializedErrors).not.toContain("https://www.alphavantage.co");
    expect(serializedErrors).not.toContain("apikey=");
    expect(serializedErrors).not.toContain(rawKey);
  });

  it("returns validation field errors without constructing a provider", async () => {
    // Arrange
    const repository = createRepository();
    const providerFactory = vi.fn(async () =>
      createProvider("alpha_vantage", async () => [candle()]),
    );
    const service = createMarketDataService({
      marketDataChunkRepository: repository,
      providerFactory,
      settingsService: createSettingsService(defaultSettings),
    });

    // Act
    const result = await service.createChunk({
      ...inputForSource("alpha_vantage"),
      ticker: "",
    });

    // Assert
    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        ticker: "Ticker is required.",
      },
      formErrors: [],
    });
    expect(providerFactory).not.toHaveBeenCalled();
    expect(repository.createChunk).not.toHaveBeenCalled();
  });
});
