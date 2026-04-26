import { describe, expect, it } from "vitest";

import type { RawMarketDataChunkInput } from "@/modules/market-data/domain/market-data-validation";
import { maybeParseMarketDataChunk } from "@/modules/market-data/domain/market-data-validation";

describe("maybeParseMarketDataChunk", () => {
  it("rejects an end date before the start date", () => {
    // Arrange
    const rawInput: RawMarketDataChunkInput = {
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
    if (result.ok) {
      throw new Error("Expected validation failure.");
    }
    expect(result.fieldErrors.endDate).toBe(
      "End date must be on or after the start date.",
    );
  });

  it("normalizes ticker casing and trims notes", () => {
    // Arrange
    const rawInput: RawMarketDataChunkInput = {
      ticker: " msft ",
      source: "alpha_vantage",
      interval: "daily",
      startDate: "2024-01-01",
      endDate: "2024-01-10",
      notes: "  keep this chunk  ",
    };

    // Act
    const result = maybeParseMarketDataChunk(rawInput);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected validation success.");
    }
    expect(result.value.ticker).toBe("MSFT");
    expect(result.value.notes).toBe("keep this chunk");
  });

  it("rejects invalid source and interval values", () => {
    // Arrange
    const rawInput = {
      ticker: "AAPL",
      source: "unknown",
      interval: "hourly",
      startDate: "2024-01-01",
      endDate: "2024-01-10",
      notes: "",
    } as unknown as Parameters<typeof maybeParseMarketDataChunk>[0];

    // Act
    const result = maybeParseMarketDataChunk(rawInput);

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected validation failure.");
    }
    expect(result.fieldErrors.source).toBeDefined();
    expect(result.fieldErrors.interval).toBeDefined();
  });
});
