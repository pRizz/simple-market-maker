import "server-only";

import type { BacktestDefinitionDraft } from "@/modules/backtests/domain/backtest-definition";
import type { Candle } from "@/modules/backtests/domain/candle";
import type { MarketDataProvider } from "@/modules/backtests/server/market-data-provider";
import { filterCandlesByDateRange } from "@/modules/market-data/domain/candle-series";
import {
  createMarketDataChunkRepository,
  type MarketDataChunkRepository,
} from "@/modules/market-data/server/market-data-chunk-repository";

export class StoredMarketDataProvider implements MarketDataProvider {
  private readonly marketDataChunkRepository: Pick<
    MarketDataChunkRepository,
    "findMatchingChunk"
  >;

  constructor(
    marketDataChunkRepository: Pick<
      MarketDataChunkRepository,
      "findMatchingChunk"
    > = createMarketDataChunkRepository(),
  ) {
    this.marketDataChunkRepository = marketDataChunkRepository;
  }

  async fetchCandles(definition: BacktestDefinitionDraft): Promise<Candle[]> {
    const maybeChunk = await this.marketDataChunkRepository.findMatchingChunk({
      ticker: definition.ticker,
      interval: "daily",
      startDate: definition.startDate,
      endDate: definition.endDate,
    });

    if (!maybeChunk) {
      throw new Error(
        `No stored daily market data covers ${definition.ticker} from ${definition.startDate.toISOString().slice(0, 10)} to ${definition.endDate.toISOString().slice(0, 10)}. Fetch a matching market data chunk first or set MARKET_DATA_SOURCE=sample.`,
      );
    }

    const matchingCandles = filterCandlesByDateRange(
      maybeChunk.candles,
      definition.startDate,
      definition.endDate,
    );

    if (matchingCandles.length === 0) {
      throw new Error(
        `Stored market data chunk ${maybeChunk.id} has no candles in the requested backtest range.`,
      );
    }

    return matchingCandles;
  }
}
