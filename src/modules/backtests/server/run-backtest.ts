import "server-only";

import {
  createBacktestService,
  type BacktestService,
} from "@/modules/backtests/server/backtest-service";

let maybeBacktestService: BacktestService | null = null;

function getBacktestService(): BacktestService {
  if (maybeBacktestService) {
    return maybeBacktestService;
  }

  maybeBacktestService = createBacktestService();
  return maybeBacktestService;
}

export async function runBacktest(definitionId: string) {
  return getBacktestService().runBacktest(definitionId);
}
