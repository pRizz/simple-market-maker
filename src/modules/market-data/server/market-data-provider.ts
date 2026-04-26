import type { Candle } from "@/modules/backtests/domain/candle";
import type {
  MarketDataInterval,
  MarketDataSource,
} from "@/modules/market-data/domain/market-data-chunk";

export type FetchMarketDataInput = {
  ticker: string;
  startDate: Date;
  endDate: Date;
  interval: MarketDataInterval;
};

export type MarketDataFetchProvider = {
  source: MarketDataSource;
  fetchCandles: (input: FetchMarketDataInput) => Promise<Candle[]>;
};
