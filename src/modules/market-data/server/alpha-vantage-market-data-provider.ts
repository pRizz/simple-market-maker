import "server-only";

import type { Candle } from "@/modules/backtests/domain/candle";
import {
  filterCandlesByDateRange,
  sortCandlesAscending,
} from "@/modules/market-data/domain/candle-series";
import type { MarketDataSource } from "@/modules/market-data/domain/market-data-chunk";
import type {
  FetchMarketDataInput,
  MarketDataFetchProvider,
} from "@/modules/market-data/server/market-data-provider";

const alphaVantageDailySeriesKey = "Time Series (Daily)";

type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<{
  json: () => Promise<unknown>;
  ok: boolean;
  status: number;
  statusText: string;
}>;

type AlphaVantageProviderOptions = {
  apiKey?: string;
  fetchFn?: FetchLike;
};

function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Alpha Vantage returned a malformed response.");
  }
}

function isEmptyRecord(value: Record<string, unknown>): boolean {
  return Object.keys(value).length === 0;
}

function maybeApiMessage(responseBody: Record<string, unknown>): string | null {
  const maybeErrorMessage = responseBody["Error Message"];
  if (typeof maybeErrorMessage === "string" && maybeErrorMessage.trim()) {
    return maybeErrorMessage;
  }

  const maybeNote = responseBody.Note;
  if (typeof maybeNote === "string" && maybeNote.trim()) {
    return maybeNote;
  }

  const maybeInformation = responseBody.Information;
  if (typeof maybeInformation === "string" && maybeInformation.trim()) {
    return maybeInformation;
  }

  return null;
}

function numberFromAlphaVantageValue(value: unknown, label: string): number {
  if (typeof value !== "string") {
    throw new Error(`Alpha Vantage ${label} value is missing.`);
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Alpha Vantage ${label} value is invalid.`);
  }

  return parsedValue;
}

function candleFromDailyEntry(dateKey: string, entry: unknown): Candle {
  assertRecord(entry);

  const occurredAt = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error(`Alpha Vantage date ${dateKey} is invalid.`);
  }

  return {
    occurredAt,
    open: numberFromAlphaVantageValue(entry["1. open"], "open"),
    high: numberFromAlphaVantageValue(entry["2. high"], "high"),
    low: numberFromAlphaVantageValue(entry["3. low"], "low"),
    close: numberFromAlphaVantageValue(entry["4. close"], "close"),
    volume: numberFromAlphaVantageValue(entry["5. volume"], "volume"),
  };
}

export function parseAlphaVantageDailyCandles(responseBody: unknown): Candle[] {
  assertRecord(responseBody);

  const maybeMessage = maybeApiMessage(responseBody);
  if (maybeMessage) {
    throw new Error(`Alpha Vantage rejected the request: ${maybeMessage}`);
  }

  const maybeSeries = responseBody[alphaVantageDailySeriesKey];
  assertRecord(maybeSeries);

  if (isEmptyRecord(maybeSeries)) {
    throw new Error("Alpha Vantage returned no daily candles.");
  }

  return sortCandlesAscending(
    Object.entries(maybeSeries).map(([dateKey, entry]) =>
      candleFromDailyEntry(dateKey, entry),
    ),
  );
}

export class AlphaVantageMarketDataProvider implements MarketDataFetchProvider {
  readonly source: MarketDataSource = "alpha_vantage";

  private readonly apiKey?: string;
  private readonly fetchFn: FetchLike;

  constructor(options: AlphaVantageProviderOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.ALPHA_VANTAGE_API_KEY;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async fetchCandles(input: FetchMarketDataInput): Promise<Candle[]> {
    if (!this.apiKey?.trim()) {
      throw new Error(
        "ALPHA_VANTAGE_API_KEY is required to fetch Alpha Vantage data.",
      );
    }

    const url = new URL("https://www.alphavantage.co/query");
    url.searchParams.set("function", "TIME_SERIES_DAILY");
    url.searchParams.set("symbol", input.ticker);
    url.searchParams.set("outputsize", "compact");
    url.searchParams.set("apikey", this.apiKey);

    const response = await this.fetchFn(url);
    if (!response.ok) {
      throw new Error(
        `Alpha Vantage request failed with ${response.status} ${response.statusText}.`,
      );
    }

    const responseBody = await response.json();
    const candles = parseAlphaVantageDailyCandles(responseBody);
    const matchingCandles = filterCandlesByDateRange(
      candles,
      input.startDate,
      input.endDate,
    );

    if (matchingCandles.length === 0) {
      throw new Error(
        "Alpha Vantage returned no daily candles for that range. The free compact endpoint usually only includes the latest 100 trading days.",
      );
    }

    return matchingCandles;
  }
}
