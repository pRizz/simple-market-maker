import { describe, expect, it } from "vitest";

import type { Candle } from "@/modules/backtests/domain/candle";
import {
  filterCandlesByDateRange,
  sortCandlesAscending,
  summarizeCandles,
  toPriceSeriesPoints,
} from "@/modules/market-data/domain/candle-series";

const unsortedCandles: Candle[] = [
  {
    occurredAt: new Date("2024-01-03T00:00:00.000Z"),
    open: 104,
    high: 108,
    low: 103,
    close: 107,
    volume: 300,
  },
  {
    occurredAt: new Date("2024-01-01T00:00:00.000Z"),
    open: 100,
    high: 102,
    low: 99,
    close: 101,
    volume: 100,
  },
  {
    occurredAt: new Date("2024-01-02T00:00:00.000Z"),
    open: 101,
    high: 105,
    low: 100,
    close: 104,
    volume: 200,
  },
];

describe("candle-series helpers", () => {
  it("sorts candles in ascending date order", () => {
    // Arrange / Act
    const sortedCandles = sortCandlesAscending(unsortedCandles);

    // Assert
    expect(sortedCandles.map((candle) => candle.close)).toEqual([101, 104, 107]);
    expect(unsortedCandles.map((candle) => candle.close)).toEqual([107, 101, 104]);
  });

  it("filters candles inclusively by date range", () => {
    // Arrange
    const startDate = new Date("2024-01-02T00:00:00.000Z");
    const endDate = new Date("2024-01-03T00:00:00.000Z");

    // Act
    const filteredCandles = filterCandlesByDateRange(
      unsortedCandles,
      startDate,
      endDate,
    );

    // Assert
    expect(filteredCandles.map((candle) => candle.close)).toEqual([104, 107]);
  });

  it("maps candles to price series points", () => {
    // Arrange / Act
    const priceSeries = toPriceSeriesPoints(unsortedCandles);

    // Assert
    expect(priceSeries[0]).toEqual({
      timestamp: "2024-01-01",
      open: 100,
      high: 102,
      low: 99,
      close: 101,
      volume: 100,
    });
  });

  it("summarizes candle ranges", () => {
    // Arrange / Act
    const summary = summarizeCandles(unsortedCandles);

    // Assert
    expect(summary).toEqual({
      firstClose: 101,
      high: 108,
      lastClose: 107,
      low: 99,
      totalVolume: 600,
    });
  });
});
