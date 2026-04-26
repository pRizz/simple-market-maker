import { describe, expect, it } from "vitest";

import { maybeParseBacktestDefinition } from "@/modules/backtests/domain/maybe-parse-backtest-definition";
import { createAskLevels, createBidLevels } from "@/modules/backtests/domain/ladder-level";
import { runLadderBacktest } from "@/modules/backtests/domain/run-ladder-backtest";
import type { RawBacktestDefinitionInput } from "@/modules/backtests/ui/backtest-form-schema";

describe("maybeParseBacktestDefinition", () => {
  it("rejects an end date before the start date", () => {
    // Arrange
    const rawInput: RawBacktestDefinitionInput = {
      name: "Momentum grid",
      ticker: "msft",
      startDate: "2024-05-10",
      endDate: "2024-05-01",
      startingCapital: 10_000,
      incrementPercent: 2,
      bidLevels: 4,
      askLevels: 4,
      orderSizeMode: "fixed_amount",
      orderSizeValue: 1_000,
      maxPositionValue: 5_000,
      feesBps: 10,
      slippageBps: 5,
      fillPolicy: "buy-first",
      notes: "Range check",
    };

    // Act
    const result = maybeParseBacktestDefinition(rawInput);

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected validation failure.");
    }
    expect(result.fieldErrors.endDate).toBe(
      "End date must be on or after the start date.",
    );
  });

  it("normalizes ticker casing and notes", () => {
    // Arrange
    const rawInput: RawBacktestDefinitionInput = {
      name: "Calm ladder",
      ticker: "aapl",
      startDate: "2024-01-01",
      endDate: "2024-01-10",
      startingCapital: 10_000,
      incrementPercent: 2,
      bidLevels: 3,
      askLevels: 3,
      orderSizeMode: "fixed_amount",
      orderSizeValue: 1_000,
      maxPositionValue: 5_000,
      feesBps: 10,
      slippageBps: 5,
      fillPolicy: "buy-first",
      notes: "  keep trimmed  ",
    };

    // Act
    const result = maybeParseBacktestDefinition(rawInput);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected validation success.");
    }
    expect(result.value.ticker).toBe("AAPL");
    expect(result.value.notes).toBe("keep trimmed");
  });
});

describe("createBidLevels and createAskLevels", () => {
  it("creates symmetric ladder prices around the reference", () => {
    // Arrange
    const referencePrice = 100;

    // Act
    const bidLevels = createBidLevels({
      incrementPercent: 2,
      levelCount: 3,
      referencePrice,
    });
    const askLevels = createAskLevels({
      incrementPercent: 2,
      levelCount: 3,
      referencePrice,
    });

    // Assert
    expect(bidLevels.map((level) => level.price)).toEqual([98, 96, 94]);
    expect(askLevels.map((level) => level.price)).toEqual([102, 104, 106]);
  });
});

describe("runLadderBacktest", () => {
  it("records buys and sells using the configured fill policy", () => {
    // Arrange
    const definition = {
      name: "Round-trip ladder",
      ticker: "AAPL",
      startDate: new Date("2024-01-01T00:00:00.000Z"),
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
    const candles = [
      {
        occurredAt: new Date("2024-01-01T00:00:00.000Z"),
        open: 100,
        high: 101,
        low: 97,
        close: 99,
        volume: 100_000,
      },
      {
        occurredAt: new Date("2024-01-02T00:00:00.000Z"),
        open: 100,
        high: 103,
        low: 99,
        close: 102,
        volume: 120_000,
      },
      {
        occurredAt: new Date("2024-01-03T00:00:00.000Z"),
        open: 101,
        high: 104,
        low: 100,
        close: 103,
        volume: 125_000,
      },
    ];

    // Act
    const result = runLadderBacktest(definition, candles);

    // Assert
    expect(result.summary.fillCount).toBeGreaterThanOrEqual(2);
    expect(result.artifacts.fillEvents[0]?.direction).toBe("buy");
    expect(result.artifacts.fillEvents.some((fillEvent) => fillEvent.direction === "sell")).toBe(
      true,
    );
    expect(result.summary.finalEquity).toBeGreaterThan(0);
    expect(result.artifacts.chartSeries.priceSeries).toHaveLength(candles.length);
  });

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
});
