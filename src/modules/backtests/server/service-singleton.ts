import "server-only";

import {
  createBacktestService,
  type BacktestService,
} from "@/modules/backtests/server/backtest-service";
import { SampleMarketDataProvider } from "@/modules/backtests/server/sample-market-data-provider";
import { StoredMarketDataProvider } from "@/modules/backtests/server/stored-market-data-provider";

let maybeBacktestService: BacktestService | null = null;

function marketDataProviderFromEnvironment() {
  if (process.env.MARKET_DATA_SOURCE === "stored") {
    return new StoredMarketDataProvider();
  }

  return new SampleMarketDataProvider();
}

export function getBacktestService(): BacktestService {
  if (maybeBacktestService) {
    return maybeBacktestService;
  }

  maybeBacktestService = createBacktestService({
    marketDataProvider: marketDataProviderFromEnvironment(),
  });

  return maybeBacktestService;
}
