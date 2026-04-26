import "server-only";

import {
  createMarketDataService,
  type MarketDataService,
} from "@/modules/market-data/server/market-data-service";

let maybeMarketDataService: MarketDataService | null = null;

export function getMarketDataService(): MarketDataService {
  if (maybeMarketDataService) {
    return maybeMarketDataService;
  }

  maybeMarketDataService = createMarketDataService();

  return maybeMarketDataService;
}
