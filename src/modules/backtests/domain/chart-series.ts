import type { PriceSeriesPoint } from "@/modules/backtests/domain/candle";
import type { DrawdownPoint } from "@/modules/backtests/domain/metrics";
import type {
  EquityPoint,
  FillEvent,
} from "@/modules/backtests/domain/simulation-state";

export type ChartPoint = {
  timestamp: string;
  value: number;
};

export type FillMarker = {
  timestamp: string;
  value: number;
  direction: FillEvent["direction"];
  quantity: number;
};

export type BacktestChartSeries = {
  priceSeries: PriceSeriesPoint[];
  equitySeries: ChartPoint[];
  drawdownSeries: ChartPoint[];
  fillMarkers: FillMarker[];
};

function toTimestamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildChartSeries(input: {
  priceSeries: PriceSeriesPoint[];
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
  fillEvents: FillEvent[];
}): BacktestChartSeries {
  return {
    priceSeries: input.priceSeries,
    equitySeries: input.equityCurve.map((equityPoint) => ({
      timestamp: toTimestamp(equityPoint.occurredAt),
      value: equityPoint.value,
    })),
    drawdownSeries: input.drawdownCurve.map((drawdownPoint) => ({
      timestamp: toTimestamp(drawdownPoint.occurredAt),
      value: drawdownPoint.value,
    })),
    fillMarkers: input.fillEvents.map((fillEvent) => ({
      timestamp: toTimestamp(fillEvent.occurredAt),
      value: fillEvent.price,
      direction: fillEvent.direction,
      quantity: fillEvent.quantity,
    })),
  };
}
