import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MarketDataChunkRecord } from "@/modules/market-data/domain/market-data-chunk";

vi.mock("server-only", () => ({}));

let StoredMarketDataProvider: typeof import("@/modules/backtests/server/stored-market-data-provider").StoredMarketDataProvider;

const baseDefinition = {
  name: "Stored data strategy",
  ticker: "AAPL",
  startDate: new Date("2024-01-02T00:00:00.000Z"),
  endDate: new Date("2024-01-03T00:00:00.000Z"),
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

function chunkRecord(): MarketDataChunkRecord {
  // Arrange helper
  const now = new Date("2024-01-04T00:00:00.000Z");

  return {
    id: "chunk-1",
    ticker: "AAPL",
    source: "sample",
    interval: "daily",
    startDate: new Date("2024-01-01T00:00:00.000Z"),
    endDate: new Date("2024-01-04T00:00:00.000Z"),
    candleCount: 4,
    candles: [
      {
        occurredAt: new Date("2024-01-01T00:00:00.000Z"),
        open: 99,
        high: 101,
        low: 98,
        close: 100,
        volume: 1_000,
      },
      {
        occurredAt: new Date("2024-01-02T00:00:00.000Z"),
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        volume: 2_000,
      },
      {
        occurredAt: new Date("2024-01-03T00:00:00.000Z"),
        open: 101,
        high: 103,
        low: 100,
        close: 102,
        volume: 3_000,
      },
    ],
    notes: "",
    fetchedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

describe("StoredMarketDataProvider", () => {
  beforeEach(async () => {
    // Arrange
    const providerModule = await import(
      "@/modules/backtests/server/stored-market-data-provider"
    );
    StoredMarketDataProvider = providerModule.StoredMarketDataProvider;
  });

  it("returns matching chunk candles filtered to the definition range", async () => {
    // Arrange
    const provider = new StoredMarketDataProvider({
      findMatchingChunk: async () => chunkRecord(),
    });

    // Act
    const candles = await provider.fetchCandles(baseDefinition);

    // Assert
    expect(candles).toHaveLength(2);
    expect(candles.map((candle) => candle.close)).toEqual([101, 102]);
  });

  it("fails clearly when no stored chunk covers the range", async () => {
    // Arrange
    const provider = new StoredMarketDataProvider({
      findMatchingChunk: async () => null,
    });

    // Act / Assert
    await expect(provider.fetchCandles(baseDefinition)).rejects.toThrow(
      "No stored daily market data covers AAPL",
    );
  });
});
