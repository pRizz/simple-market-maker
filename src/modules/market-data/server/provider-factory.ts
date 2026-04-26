import "server-only";

import type { MarketDataSource } from "@/modules/market-data/domain/market-data-chunk";
import { AlphaVantageMarketDataProvider } from "@/modules/market-data/server/alpha-vantage-market-data-provider";
import type { MarketDataFetchProvider } from "@/modules/market-data/server/market-data-provider";
import { SampleMarketDataFetchProvider } from "@/modules/market-data/server/sample-market-data-fetch-provider";

export function createMarketDataProvider(
  source: MarketDataSource,
): MarketDataFetchProvider {
  if (source === "sample") {
    return new SampleMarketDataFetchProvider();
  }

  return new AlphaVantageMarketDataProvider();
}
