import {
  orderNotionalValue,
  type BacktestDefinitionDraft,
} from "@/modules/backtests/domain/backtest-definition";
import { type Candle, type PriceSeriesPoint } from "@/modules/backtests/domain/candle";
import {
  buildChartSeries,
  type BacktestChartSeries,
} from "@/modules/backtests/domain/chart-series";
import { fillPriorityByPolicy } from "@/modules/backtests/domain/constants";
import {
  countFilledLevels,
  createAskLevels,
  createBidLevels,
  type LadderLevel,
} from "@/modules/backtests/domain/ladder-level";
import {
  buildDrawdownSeries,
  calculateBacktestMetrics,
  roundCurrency,
  roundPercent,
  type DrawdownPoint,
} from "@/modules/backtests/domain/metrics";
import {
  buildPriceSeriesPoint,
  createInitialSimulationState,
  type FillEvent,
  type SimulationState,
} from "@/modules/backtests/domain/simulation-state";

type FillCandidate = {
  direction: LadderLevel["direction"];
  levelIndex: number;
  levelPrice: number;
};

export type BacktestSummary = {
  ticker: string;
  startingCapital: number;
  finalEquity: number;
  finalCash: number;
  endingPositionQuantity: number;
  endingPositionMarketValue: number;
  totalReturnPercent: number;
  maxDrawdownPercent: number;
  realizedProfitLoss: number;
  unrealizedProfitLoss: number;
  tradeCount: number;
  fillCount: number;
  winRatePercent: number;
  exposurePercent: number;
  averageDaysBetweenFills: number;
};

export type BacktestArtifacts = {
  priceSeries: PriceSeriesPoint[];
  chartSeries: BacktestChartSeries;
  drawdownCurve: DrawdownPoint[];
  fillEvents: FillEvent[];
};

export type BacktestSimulationResult = {
  summary: BacktestSummary;
  artifacts: BacktestArtifacts;
};

function sortFillCandidates(
  fillCandidates: FillCandidate[],
  fillPolicy: BacktestDefinitionDraft["fillPolicy"],
): FillCandidate[] {
  if (fillCandidates.length <= 1) {
    return fillCandidates;
  }

  const priority = fillPriorityByPolicy[fillPolicy];

  return [...fillCandidates].sort(
    (leftCandidate, rightCandidate) =>
      priority.indexOf(leftCandidate.direction) -
      priority.indexOf(rightCandidate.direction),
  );
}

function firstMatchingLevel(
  direction: LadderLevel["direction"],
  candle: Candle,
  levels: LadderLevel[],
): FillCandidate | null {
  const levelIndex = levels.findIndex((level) =>
    direction === "bid" ? candle.low <= level.price : candle.high >= level.price,
  );

  if (levelIndex < 0) {
    return null;
  }

  return {
    direction,
    levelIndex,
    levelPrice: levels[levelIndex].price,
  };
}

function quantityForLevel(orderValue: number, levelPrice: number): number {
  if (levelPrice <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor((orderValue / levelPrice) * 10_000) / 10_000);
}

function feeAmount(notionalValue: number, feesBps: number): number {
  return roundCurrency(notionalValue * (feesBps / 10_000));
}

function slippageMultiplier(
  direction: FillCandidate["direction"],
  slippageBps: number,
): number {
  const offset = slippageBps / 10_000;

  if (direction === "bid") {
    return 1 + offset;
  }

  return 1 - offset;
}

function appendEquityPoint(
  simulationState: SimulationState,
  candle: Candle,
): void {
  const marketValue = roundCurrency(
    simulationState.positionQuantity * candle.close,
  );
  const equity = roundCurrency(simulationState.cash + marketValue);

  simulationState.equityCurve.push({
    occurredAt: candle.occurredAt,
    cash: simulationState.cash,
    marketValue,
    positionQuantity: simulationState.positionQuantity,
    value: equity,
  });
  simulationState.latestReferencePrice = candle.close;
}

function maybeApplyFillCandidate(
  simulationState: SimulationState,
  definition: BacktestDefinitionDraft,
  candle: Candle,
  fillCandidate: FillCandidate,
  bidLevels: LadderLevel[],
  askLevels: LadderLevel[],
): void {
  const executedPrice = roundCurrency(
    fillCandidate.levelPrice *
      slippageMultiplier(fillCandidate.direction, definition.slippageBps),
  );
  const quantity = quantityForLevel(
    orderNotionalValue(definition),
    executedPrice,
  );

  if (quantity <= 0) {
    return;
  }

  if (fillCandidate.direction === "bid") {
    const maybeNextPositionQuantity =
      simulationState.positionQuantity + quantity;

    if (maybeNextPositionQuantity * executedPrice > definition.maxPositionValue) {
      return;
    }

    const notionalValue = roundCurrency(quantity * executedPrice);
    const fees = feeAmount(notionalValue, definition.feesBps);
    const totalCost = roundCurrency(notionalValue + fees);

    if (totalCost > simulationState.cash) {
      return;
    }

    const priorCostBasis = roundCurrency(
      simulationState.averageCost * simulationState.positionQuantity,
    );

    simulationState.cash = roundCurrency(simulationState.cash - totalCost);
    simulationState.positionQuantity = roundCurrency(maybeNextPositionQuantity);
    simulationState.averageCost = roundCurrency(
      (priorCostBasis + notionalValue + fees) /
        simulationState.positionQuantity,
    );
    simulationState.fillEvents.push({
      occurredAt: candle.occurredAt,
      direction: "buy",
      quantity,
      price: executedPrice,
      fees,
      realizedProfitLoss: 0,
      cashBalanceAfterFill: simulationState.cash,
      positionQuantityAfterFill: simulationState.positionQuantity,
      levelIndex: fillCandidate.levelIndex,
      referencePrice: candle.close,
    });
    bidLevels[fillCandidate.levelIndex] = {
      ...bidLevels[fillCandidate.levelIndex],
      fillCount: bidLevels[fillCandidate.levelIndex].fillCount + 1,
    };

    return;
  }

  if (quantity > simulationState.positionQuantity) {
    return;
  }

  const proceeds = roundCurrency(quantity * executedPrice);
  const fees = feeAmount(proceeds, definition.feesBps);
  const realizedProfitLoss = roundCurrency(
    proceeds - fees - quantity * simulationState.averageCost,
  );

  simulationState.cash = roundCurrency(simulationState.cash + proceeds - fees);
  simulationState.positionQuantity = roundCurrency(
    simulationState.positionQuantity - quantity,
  );
  simulationState.realizedProfitLoss = roundCurrency(
    simulationState.realizedProfitLoss + realizedProfitLoss,
  );
  simulationState.fillEvents.push({
    occurredAt: candle.occurredAt,
    direction: "sell",
    quantity,
    price: executedPrice,
    fees,
    realizedProfitLoss,
    cashBalanceAfterFill: simulationState.cash,
    positionQuantityAfterFill: simulationState.positionQuantity,
    levelIndex: fillCandidate.levelIndex,
    referencePrice: candle.close,
  });
  askLevels[fillCandidate.levelIndex] = {
    ...askLevels[fillCandidate.levelIndex],
    fillCount: askLevels[fillCandidate.levelIndex].fillCount + 1,
  };

  if (simulationState.positionQuantity === 0) {
    simulationState.averageCost = 0;
  }
}

function averageDaysBetweenFills(fillEvents: FillEvent[]): number {
  if (fillEvents.length < 2) {
    return 0;
  }

  let totalDays = 0;

  for (let index = 1; index < fillEvents.length; index += 1) {
    const previousTimestamp = fillEvents[index - 1].occurredAt.getTime();
    const currentTimestamp = fillEvents[index].occurredAt.getTime();

    totalDays +=
      Math.abs(currentTimestamp - previousTimestamp) / (24 * 60 * 60 * 1000);
  }

  return roundCurrency(totalDays / (fillEvents.length - 1));
}

function exposurePercent(chartSeries: BacktestChartSeries): number {
  if (
    chartSeries.priceSeries.length === 0 ||
    chartSeries.equitySeries.length === 0
  ) {
    return 0;
  }

  let totalExposure = 0;

  for (let index = 0; index < chartSeries.priceSeries.length; index += 1) {
    const maybeEquityPoint = chartSeries.equitySeries[index];

    if (!maybeEquityPoint || maybeEquityPoint.value <= 0) {
      continue;
    }

    totalExposure += chartSeries.priceSeries[index].close / maybeEquityPoint.value;
  }

  return roundPercent((totalExposure / chartSeries.priceSeries.length) * 100);
}

function winRatePercent(
  fillEvents: FillEvent[],
  averageCost: number,
): number {
  const sellEvents = fillEvents.filter((fillEvent) => fillEvent.direction === "sell");

  if (sellEvents.length === 0) {
    return 0;
  }

  const profitableSellCount = sellEvents.filter(
    (fillEvent) => fillEvent.price > averageCost,
  ).length;

  return roundPercent((profitableSellCount / sellEvents.length) * 100);
}

export function runLadderBacktest(
  definition: BacktestDefinitionDraft,
  candles: Candle[],
): BacktestSimulationResult {
  if (candles.length === 0) {
    throw new Error("Backtests require at least one candle.");
  }

  const initialReferencePrice = candles[0].open;
  const bidLevels = createBidLevels({
    incrementPercent: definition.incrementPercent,
    levelCount: definition.bidLevels,
    referencePrice: initialReferencePrice,
  });
  const askLevels = createAskLevels({
    incrementPercent: definition.incrementPercent,
    levelCount: definition.askLevels,
    referencePrice: initialReferencePrice,
  });
  const simulationState = createInitialSimulationState({
    startingCapital: definition.startingCapital,
    referencePrice: initialReferencePrice,
  });

  for (const candle of candles) {
    const fillCandidates = sortFillCandidates(
      [
        firstMatchingLevel("bid", candle, bidLevels),
        firstMatchingLevel("ask", candle, askLevels),
      ].filter(
        (maybeCandidate): maybeCandidate is FillCandidate =>
          maybeCandidate !== null,
      ),
      definition.fillPolicy,
    );

    for (const fillCandidate of fillCandidates) {
      maybeApplyFillCandidate(
        simulationState,
        definition,
        candle,
        fillCandidate,
        bidLevels,
        askLevels,
      );
    }

    appendEquityPoint(simulationState, candle);
  }

  const priceSeries = candles.map((candle) => buildPriceSeriesPoint(candle));
  const drawdownCurve = buildDrawdownSeries(simulationState.equityCurve);
  const chartSeries = buildChartSeries({
    priceSeries,
    equityCurve: simulationState.equityCurve,
    drawdownCurve,
    fillEvents: simulationState.fillEvents,
  });
  const latestCandle = candles[candles.length - 1];
  const metrics = calculateBacktestMetrics({
    endingCash: simulationState.cash,
    endingPositionQuantity: simulationState.positionQuantity,
    latestClosePrice: latestCandle.close,
    realizedProfitLoss: simulationState.realizedProfitLoss,
    startingCapital: definition.startingCapital,
    averageCost: simulationState.averageCost,
    drawdownCurve,
  });
  const endingPositionMarketValue = roundCurrency(
    metrics.endingPositionQuantity * latestCandle.close,
  );

  return {
    summary: {
      ticker: definition.ticker,
      startingCapital: definition.startingCapital,
      finalEquity: metrics.endingEquity,
      finalCash: metrics.endingCash,
      endingPositionQuantity: metrics.endingPositionQuantity,
      endingPositionMarketValue,
      totalReturnPercent: metrics.totalReturnPercent,
      maxDrawdownPercent: metrics.maxDrawdownPercent,
      realizedProfitLoss: metrics.realizedProfitLoss,
      unrealizedProfitLoss: metrics.unrealizedProfitLoss,
      tradeCount: countFilledLevels(bidLevels) + countFilledLevels(askLevels),
      fillCount: simulationState.fillEvents.length,
      winRatePercent: winRatePercent(
        simulationState.fillEvents,
        simulationState.averageCost,
      ),
      exposurePercent: exposurePercent(chartSeries),
      averageDaysBetweenFills: averageDaysBetweenFills(
        simulationState.fillEvents,
      ),
    },
    artifacts: {
      priceSeries,
      chartSeries,
      drawdownCurve,
      fillEvents: simulationState.fillEvents,
    },
  };
}
