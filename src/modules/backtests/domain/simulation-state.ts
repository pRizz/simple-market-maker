import type {
  Candle,
  PriceSeriesPoint,
} from "@/modules/backtests/domain/candle";
import { roundCurrency } from "@/modules/backtests/domain/metrics";

export type FillDirection = "buy" | "sell";

export type FillEvent = {
  occurredAt: Date;
  direction: FillDirection;
  quantity: number;
  price: number;
  fees: number;
  realizedProfitLoss: number;
  cashBalanceAfterFill: number;
  positionQuantityAfterFill: number;
  levelIndex: number;
  referencePrice: number;
};

export type EquityPoint = {
  occurredAt: Date;
  cash: number;
  marketValue: number;
  positionQuantity: number;
  value: number;
};

export type SimulationState = {
  cash: number;
  positionQuantity: number;
  averageCost: number;
  realizedProfitLoss: number;
  equityCurve: EquityPoint[];
  fillEvents: FillEvent[];
  latestReferencePrice: number;
};

export function createInitialSimulationState(input: {
  startingCapital: number;
  referencePrice: number;
}): SimulationState {
  return {
    cash: input.startingCapital,
    positionQuantity: 0,
    averageCost: 0,
    realizedProfitLoss: 0,
    equityCurve: [],
    fillEvents: [],
    latestReferencePrice: input.referencePrice,
  };
}

export function buildPriceSeriesPoint(candle: Candle): PriceSeriesPoint {
  return {
    timestamp: candle.occurredAt.toISOString().slice(0, 10),
    open: roundCurrency(candle.open),
    high: roundCurrency(candle.high),
    low: roundCurrency(candle.low),
    close: roundCurrency(candle.close),
    volume: candle.volume,
  };
}
