import "server-only";

import type { Candle } from "@/modules/backtests/domain/candle";
import { SampleMarketDataProvider } from "@/modules/backtests/server/sample-market-data-provider";
import type { MarketDataSource } from "@/modules/market-data/domain/market-data-chunk";
import type {
  FetchMarketDataInput,
  MarketDataFetchProvider,
} from "@/modules/market-data/server/market-data-provider";

export class SampleMarketDataFetchProvider implements MarketDataFetchProvider {
  readonly source: MarketDataSource = "sample";

  private readonly provider = new SampleMarketDataProvider();

  async fetchCandles(input: FetchMarketDataInput): Promise<Candle[]> {
    return this.provider.fetchCandles({
      name: `${input.ticker} sample market data`,
      ticker: input.ticker,
      startDate: input.startDate,
      endDate: input.endDate,
      startingCapital: 10_000,
      incrementPercent: 2,
      bidLevels: 1,
      askLevels: 1,
      orderSizeMode: "fixed_amount",
      orderSizeValue: 1_000,
      maxPositionValue: 5_000,
      feesBps: 0,
      slippageBps: 0,
      fillPolicy: "buy-first",
      notes: "",
    });
  }
}
