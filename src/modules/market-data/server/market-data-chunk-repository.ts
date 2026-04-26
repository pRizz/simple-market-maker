import "server-only";

import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import type { Candle } from "@/modules/backtests/domain/candle";
import { sortCandlesAscending } from "@/modules/market-data/domain/candle-series";
import type {
  MarketDataChunkDraft,
  MarketDataChunkRecord,
  MarketDataInterval,
} from "@/modules/market-data/domain/market-data-chunk";
import { getDbOrThrow } from "@/modules/db/client";
import { marketDataChunksTable } from "@/modules/db/schema";

type ChunkRow = typeof marketDataChunksTable.$inferSelect;

type MatchingChunkInput = {
  endDate: Date;
  interval: MarketDataInterval;
  startDate: Date;
  ticker: string;
};

function dateFromUnknown(value: unknown, label: string): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string") {
    throw new Error(`Persisted candle ${label} is missing.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Persisted candle ${label} is invalid.`);
  }

  return date;
}

function numberFromUnknown(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Persisted candle ${label} is invalid.`);
  }

  return value;
}

function candleFromUnknown(value: unknown): Candle {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Persisted candle is malformed.");
  }

  const record = value as Record<string, unknown>;

  return {
    occurredAt: dateFromUnknown(record.occurredAt, "date"),
    open: numberFromUnknown(record.open, "open"),
    high: numberFromUnknown(record.high, "high"),
    low: numberFromUnknown(record.low, "low"),
    close: numberFromUnknown(record.close, "close"),
    volume: numberFromUnknown(record.volume, "volume"),
  };
}

function candlesFromJson(candlesJson: unknown): Candle[] {
  if (!Array.isArray(candlesJson)) {
    throw new Error("Persisted market data candles are malformed.");
  }

  return sortCandlesAscending(candlesJson.map(candleFromUnknown));
}

function candlesToJson(candles: Candle[]): Array<Record<string, unknown>> {
  return sortCandlesAscending(candles).map((candle) => ({
    occurredAt: candle.occurredAt.toISOString(),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  }));
}

function mapChunkRow(row: ChunkRow): MarketDataChunkRecord {
  return {
    id: row.id,
    ticker: row.ticker,
    source: row.source,
    interval: row.interval,
    startDate: row.startDate,
    endDate: row.endDate,
    candleCount: row.candleCount,
    candles: candlesFromJson(row.candlesJson),
    notes: row.notes,
    fetchedAt: row.fetchedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type MarketDataChunkRepository = ReturnType<
  typeof createMarketDataChunkRepository
>;

export function createMarketDataChunkRepository() {
  return {
    async createChunk(input: {
      candles: Candle[];
      draft: MarketDataChunkDraft;
      fetchedAt: Date;
    }): Promise<MarketDataChunkRecord> {
      const candleRows = candlesToJson(input.candles);
      const [row] = await getDbOrThrow()
        .insert(marketDataChunksTable)
        .values({
          ticker: input.draft.ticker,
          source: input.draft.source,
          interval: input.draft.interval,
          startDate: input.draft.startDate,
          endDate: input.draft.endDate,
          candleCount: input.candles.length,
          candlesJson: candleRows,
          notes: input.draft.notes,
          fetchedAt: input.fetchedAt,
        })
        .returning();

      return mapChunkRow(row);
    },

    async deleteChunk(chunkId: string): Promise<boolean> {
      const deletedRows = await getDbOrThrow()
        .delete(marketDataChunksTable)
        .where(eq(marketDataChunksTable.id, chunkId))
        .returning({ id: marketDataChunksTable.id });

      return deletedRows.length > 0;
    },

    async findMatchingChunk(
      input: MatchingChunkInput,
    ): Promise<MarketDataChunkRecord | null> {
      const [row] = await getDbOrThrow()
        .select()
        .from(marketDataChunksTable)
        .where(
          and(
            eq(marketDataChunksTable.ticker, input.ticker),
            eq(marketDataChunksTable.interval, input.interval),
            lte(marketDataChunksTable.startDate, input.startDate),
            gte(marketDataChunksTable.endDate, input.endDate),
          ),
        )
        .orderBy(desc(marketDataChunksTable.fetchedAt))
        .limit(1);

      return row ? mapChunkRow(row) : null;
    },

    async getChunkById(chunkId: string): Promise<MarketDataChunkRecord | null> {
      const [row] = await getDbOrThrow()
        .select()
        .from(marketDataChunksTable)
        .where(eq(marketDataChunksTable.id, chunkId))
        .limit(1);

      return row ? mapChunkRow(row) : null;
    },

    async listChunks(): Promise<MarketDataChunkRecord[]> {
      const rows = await getDbOrThrow()
        .select()
        .from(marketDataChunksTable)
        .orderBy(
          desc(marketDataChunksTable.createdAt),
          asc(marketDataChunksTable.ticker),
        );

      return rows.map(mapChunkRow);
    },
  };
}

export function persistedCandlesToJson(
  candles: Candle[],
): Array<Record<string, unknown>> {
  return candlesToJson(candles);
}
