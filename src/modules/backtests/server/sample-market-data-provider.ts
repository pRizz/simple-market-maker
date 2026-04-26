import type { BacktestDefinitionDraft } from "@/modules/backtests/domain/backtest-definition";
import type { Candle } from "@/modules/backtests/domain/candle";
import type { MarketDataProvider } from "@/modules/backtests/server/market-data-provider";

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

function dayCount(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const start = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  );
  const end = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  );

  return Math.max(1, Math.floor((end - start) / millisecondsPerDay) + 1);
}

function buildSyntheticCandle(
  occurredAt: Date,
  baselinePrice: number,
  index: number,
): Candle {
  const wave = Math.sin(index / 3) * 4;
  const drift = index * 0.18;
  const open = roundPrice(baselinePrice + wave + drift);
  const close = roundPrice(open + Math.cos(index / 2) * 1.4);
  const high = roundPrice(Math.max(open, close) + 1.5 + (index % 3) * 0.25);
  const low = roundPrice(Math.min(open, close) - 1.25 - (index % 2) * 0.3);

  return {
    occurredAt,
    open,
    high,
    low,
    close,
    volume: 500_000 + index * 12_500,
  };
}

export class SampleMarketDataProvider implements MarketDataProvider {
  async fetchCandles(
    definition: BacktestDefinitionDraft,
  ): Promise<Candle[]> {
    const candleCount = dayCount(definition.startDate, definition.endDate);
    const baselinePrice =
      80 +
      (definition.ticker
        .split("")
        .reduce((total, character) => total + character.charCodeAt(0), 0) %
        45);

    return Array.from({ length: candleCount }, (_, index) => {
      const occurredAt = new Date(
        Date.UTC(
          definition.startDate.getUTCFullYear(),
          definition.startDate.getUTCMonth(),
          definition.startDate.getUTCDate() + index,
        ),
      );

      return buildSyntheticCandle(occurredAt, baselinePrice, index);
    });
  }
}
