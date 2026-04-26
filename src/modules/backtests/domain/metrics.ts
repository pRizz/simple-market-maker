export type DrawdownPoint = {
  occurredAt: Date;
  value: number;
};

export type BacktestMetrics = {
  endingCash: number;
  endingEquity: number;
  endingPositionQuantity: number;
  maxDrawdownPercent: number;
  realizedProfitLoss: number;
  totalReturnPercent: number;
  unrealizedProfitLoss: number;
};

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundPercent(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export type EquitySnapshot = {
  occurredAt: Date;
  value: number;
};

export function buildDrawdownSeries(
  equityCurve: EquitySnapshot[],
): DrawdownPoint[] {
  let peakValue = 0;

  return equityCurve.map((equityPoint) => {
    peakValue = Math.max(peakValue, equityPoint.value);

    if (peakValue === 0) {
      return {
        occurredAt: equityPoint.occurredAt,
        value: 0,
      };
    }

    const drawdownPercent = ((equityPoint.value - peakValue) / peakValue) * 100;

    return {
      occurredAt: equityPoint.occurredAt,
      value: roundPercent(drawdownPercent),
    };
  });
}

export function calculateBacktestMetrics(input: {
  endingCash: number;
  endingPositionQuantity: number;
  latestClosePrice: number;
  realizedProfitLoss: number;
  startingCapital: number;
  averageCost: number;
  drawdownCurve: DrawdownPoint[];
}): BacktestMetrics {
  const endingMarketValue = roundCurrency(
    input.endingPositionQuantity * input.latestClosePrice,
  );
  const endingEquity = roundCurrency(input.endingCash + endingMarketValue);
  const unrealizedProfitLoss = roundCurrency(
    (input.latestClosePrice - input.averageCost) * input.endingPositionQuantity,
  );
  const maxDrawdownPercent = roundPercent(
    Math.abs(Math.min(...input.drawdownCurve.map((point) => point.value), 0)),
  );

  return {
    endingCash: roundCurrency(input.endingCash),
    endingEquity,
    endingPositionQuantity: roundCurrency(input.endingPositionQuantity),
    maxDrawdownPercent,
    realizedProfitLoss: roundCurrency(input.realizedProfitLoss),
    totalReturnPercent: roundPercent(
      ((endingEquity - input.startingCapital) / input.startingCapital) * 100,
    ),
    unrealizedProfitLoss,
  };
}
