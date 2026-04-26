import { describe, expect, it, vi } from "vitest";

import { AlphaVantageMarketDataProvider } from "@/modules/market-data/server/alpha-vantage-market-data-provider";
import type { FetchLike } from "@/modules/market-data/server/alpha-vantage-market-data-provider";

vi.mock("server-only", () => ({}));

function successfulFetch(body: unknown): FetchLike {
  return async () => ({
    json: async () => body,
    ok: true,
    status: 200,
    statusText: "OK",
  });
}

function providerForBody(body: unknown): AlphaVantageMarketDataProvider {
  return new AlphaVantageMarketDataProvider({
    apiKey: "demo",
    fetchFn: successfulFetch(body),
  });
}

function dailySeriesBody(): unknown {
  return {
    "Time Series (Daily)": {
      "2024-01-03": {
        "1. open": "103.00",
        "2. high": "106.00",
        "3. low": "102.00",
        "4. close": "105.00",
        "5. volume": "3000",
      },
      "2024-01-02": {
        "1. open": "101.00",
        "2. high": "104.00",
        "3. low": "100.00",
        "4. close": "103.00",
        "5. volume": "2000",
      },
    },
  };
}

describe("AlphaVantageMarketDataProvider", () => {
  it("parses and filters valid daily responses", async () => {
    // Arrange
    const provider = providerForBody(dailySeriesBody());

    // Act
    const candles = await provider.fetchCandles({
      ticker: "AAPL",
      interval: "daily",
      startDate: new Date("2024-01-02T00:00:00.000Z"),
      endDate: new Date("2024-01-02T00:00:00.000Z"),
    });

    // Assert
    expect(candles).toHaveLength(1);
    expect(candles[0]).toMatchObject({
      close: 103,
      volume: 2000,
    });
  });

  it("sends the expected Alpha Vantage query", async () => {
    // Arrange
    const fetchFn = vi.fn(successfulFetch(dailySeriesBody()));
    const provider = new AlphaVantageMarketDataProvider({
      apiKey: "demo-key",
      fetchFn,
    });

    // Act
    await provider.fetchCandles({
      ticker: "MSFT",
      interval: "daily",
      startDate: new Date("2024-01-02T00:00:00.000Z"),
      endDate: new Date("2024-01-03T00:00:00.000Z"),
    });

    // Assert
    const firstCall = fetchFn.mock.calls[0];
    if (!firstCall) {
      throw new Error("Expected Alpha Vantage provider to call fetch.");
    }
    const requestedUrl = firstCall[0];
    expect(requestedUrl).toBeInstanceOf(URL);
    if (!(requestedUrl instanceof URL)) {
      throw new Error("Expected Alpha Vantage provider to call URL.");
    }
    expect(requestedUrl.searchParams.get("function")).toBe("TIME_SERIES_DAILY");
    expect(requestedUrl.searchParams.get("symbol")).toBe("MSFT");
    expect(requestedUrl.searchParams.get("outputsize")).toBe("compact");
    expect(requestedUrl.searchParams.get("apikey")).toBe("demo-key");
  });

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

  it("handles rate-limit notes", async () => {
    // Arrange
    const provider = providerForBody({
      Note: "Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute.",
    });

    // Act / Assert
    await expect(
      provider.fetchCandles({
        ticker: "AAPL",
        interval: "daily",
        startDate: new Date("2024-01-01T00:00:00.000Z"),
        endDate: new Date("2024-01-05T00:00:00.000Z"),
      }),
    ).rejects.toThrow("Alpha Vantage rejected the request");
  });

  it("fails clearly when no candles match the requested range", async () => {
    // Arrange
    const provider = providerForBody({
      "Time Series (Daily)": {
        "2024-01-03": {
          "1. open": "103.00",
          "2. high": "106.00",
          "3. low": "102.00",
          "4. close": "105.00",
          "5. volume": "3000",
        },
      },
    });

    // Act / Assert
    await expect(
      provider.fetchCandles({
        ticker: "AAPL",
        interval: "daily",
        startDate: new Date("2023-01-01T00:00:00.000Z"),
        endDate: new Date("2023-01-05T00:00:00.000Z"),
      }),
    ).rejects.toThrow("returned no daily candles");
  });
});
