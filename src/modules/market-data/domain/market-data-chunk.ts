import type { Candle } from "@/modules/backtests/domain/candle";

export const marketDataSources = ["sample", "alpha_vantage"] as const;
export const marketDataIntervals = ["daily"] as const;

export type MarketDataSource = (typeof marketDataSources)[number];
export type MarketDataInterval = (typeof marketDataIntervals)[number];

export const marketDataChunkFieldNames = [
  "ticker",
  "source",
  "interval",
  "startDate",
  "endDate",
  "notes",
] as const;

export type MarketDataChunkFieldName =
  (typeof marketDataChunkFieldNames)[number];

export type MarketDataChunkDraft = {
  ticker: string;
  source: MarketDataSource;
  interval: MarketDataInterval;
  startDate: Date;
  endDate: Date;
  notes: string;
};

export type MarketDataChunkRecord = MarketDataChunkDraft & {
  id: string;
  candleCount: number;
  candles: Candle[];
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type MarketDataChunkFormValues = {
  ticker: string;
  source: MarketDataSource;
  interval: MarketDataInterval;
  startDate: string;
  endDate: string;
  notes: string;
};

export const maxMarketDataNotesLength = 1_000;

export function normalizeTicker(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeMarketDataNotes(value: string): string {
  return value.trim().slice(0, maxMarketDataNotesLength);
}

export function toMarketDataChunkFormValues(
  chunk: MarketDataChunkDraft,
): MarketDataChunkFormValues {
  return {
    ticker: chunk.ticker,
    source: chunk.source,
    interval: chunk.interval,
    startDate: chunk.startDate.toISOString().slice(0, 10),
    endDate: chunk.endDate.toISOString().slice(0, 10),
    notes: chunk.notes,
  };
}

export function formatMarketDataChunkLabel(
  chunk: Pick<
    MarketDataChunkRecord,
    "ticker" | "source" | "startDate" | "endDate"
  >,
): string {
  const startDate = chunk.startDate.toISOString().slice(0, 10);
  const endDate = chunk.endDate.toISOString().slice(0, 10);

  return `${chunk.ticker} ${startDate} → ${endDate} (${chunk.source})`;
}
