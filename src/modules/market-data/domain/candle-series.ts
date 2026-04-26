import type {
  Candle,
  PriceSeriesPoint,
} from "@/modules/backtests/domain/candle";

export type CandleSeriesSummary = {
  firstClose: number | null;
  high: number | null;
  lastClose: number | null;
  low: number | null;
  totalVolume: number;
};

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function compareCandlesByDate(leftCandle: Candle, rightCandle: Candle): number {
  return leftCandle.occurredAt.getTime() - rightCandle.occurredAt.getTime();
}

export function sortCandlesAscending(candles: Candle[]): Candle[] {
  return [...candles].sort(compareCandlesByDate);
}

export function filterCandlesByDateRange(
  candles: Candle[],
  startDate: Date,
  endDate: Date,
): Candle[] {
  const startKey = dayKey(startDate);
  const endKey = dayKey(endDate);

  return sortCandlesAscending(candles).filter((candle) => {
    const candleKey = dayKey(candle.occurredAt);

    return candleKey >= startKey && candleKey <= endKey;
  });
}

export function toPriceSeriesPoints(candles: Candle[]): PriceSeriesPoint[] {
  return sortCandlesAscending(candles).map((candle) => ({
    timestamp: dayKey(candle.occurredAt),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  }));
}

export function summarizeCandles(candles: Candle[]): CandleSeriesSummary {
  if (candles.length === 0) {
    return {
      firstClose: null,
      high: null,
      lastClose: null,
      low: null,
      totalVolume: 0,
    };
  }

  const sortedCandles = sortCandlesAscending(candles);
  const firstCandle = sortedCandles[0] as Candle;
  const lastCandle = sortedCandles[sortedCandles.length - 1] as Candle;

  return {
    firstClose: firstCandle.close,
    high: Math.max(...sortedCandles.map((candle) => candle.high)),
    lastClose: lastCandle.close,
    low: Math.min(...sortedCandles.map((candle) => candle.low)),
    totalVolume: sortedCandles.reduce(
      (totalVolume, candle) => totalVolume + candle.volume,
      0,
    ),
  };
}
