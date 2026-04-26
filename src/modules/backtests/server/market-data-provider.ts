import type { BacktestDefinitionDraft } from "@/modules/backtests/domain/backtest-definition";
import type { Candle } from "@/modules/backtests/domain/candle";

export type MarketDataProvider = {
  fetchCandles: (definition: BacktestDefinitionDraft) => Promise<Candle[]>;
};
