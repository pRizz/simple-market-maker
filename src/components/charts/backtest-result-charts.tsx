"use client";

import ReactECharts from "echarts-for-react";

type ChartPoint = {
  timestamp: string;
  value: number;
};

type FillMarker = {
  timestamp: string;
  value: number;
  direction: "buy" | "sell";
  quantity: number;
};

type PriceSeriesPoint = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type BacktestResultChartsProps = {
  chartSeries: {
    priceSeries: PriceSeriesPoint[];
    equitySeries: ChartPoint[];
    drawdownSeries: ChartPoint[];
    fillMarkers: FillMarker[];
  };
  ticker?: string;
};

function buildPriceOptions(
  priceSeries: PriceSeriesPoint[],
  fillMarkers: FillMarker[],
) {
  return {
    animation: false,
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: priceSeries.map((point) => point.timestamp),
      axisLabel: {
        color: "#94a3b8",
      },
      axisLine: {
        lineStyle: {
          color: "rgba(148, 163, 184, 0.2)",
        },
      },
    },
    yAxis: {
      scale: true,
      axisLabel: {
        color: "#94a3b8",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(148, 163, 184, 0.12)",
        },
      },
    },
    series: [
      {
        type: "candlestick",
        data: priceSeries.map((point) => [
          point.open,
          point.close,
          point.low,
          point.high,
        ]),
        itemStyle: {
          color: "#22c55e",
          color0: "#ef4444",
          borderColor: "#22c55e",
          borderColor0: "#ef4444",
        },
        markPoint: {
          data: fillMarkers.map((marker) => ({
            name: marker.direction === "buy" ? "Buy" : "Sell",
            coord: [marker.timestamp, marker.value],
            value: `${marker.direction === "buy" ? "Buy" : "Sell"} ${marker.quantity.toFixed(4)}`,
            itemStyle: {
              color: marker.direction === "buy" ? "#38bdf8" : "#f97316",
            },
          })),
        },
      },
    ],
    grid: {
      left: 52,
      right: 20,
      top: 24,
      bottom: 40,
    },
  };
}

function buildLineOptions(
  series: ChartPoint[],
  color: string,
  areaColor: string,
  label: string,
) {
  return {
    animation: false,
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: series.map((point) => point.timestamp),
      axisLabel: {
        color: "#94a3b8",
      },
      axisLine: {
        lineStyle: {
          color: "rgba(148, 163, 184, 0.2)",
        },
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#94a3b8",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(148, 163, 184, 0.12)",
        },
      },
    },
    series: [
      {
        type: "line",
        name: label,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color,
          width: 2,
        },
        areaStyle: {
          color: areaColor,
        },
        data: series.map((point) => point.value),
      },
    ],
    grid: {
      left: 52,
      right: 20,
      top: 24,
      bottom: 40,
    },
  };
}

export function BacktestResultCharts({
  chartSeries,
  ticker,
}: BacktestResultChartsProps): React.JSX.Element {
  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Price action & fills</h2>
        <p className="mt-1 text-sm text-slate-400">
          Daily candles with ladder strategy fill markers
          {ticker ? ` for ${ticker}.` : "."}
        </p>
        <ReactECharts
          option={buildPriceOptions(
            chartSeries.priceSeries,
            chartSeries.fillMarkers,
          )}
          style={{ height: 360, width: "100%" }}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-white">Equity curve</h2>
          <p className="mt-1 text-sm text-slate-400">
            Ending account equity through the backtest period.
          </p>
          <ReactECharts
            option={buildLineOptions(
              chartSeries.equitySeries,
              "#38bdf8",
              "rgba(56, 189, 248, 0.14)",
              "Equity",
            )}
            style={{ height: 280, width: "100%" }}
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-white">Drawdown</h2>
          <p className="mt-1 text-sm text-slate-400">
            Percentage drawdown from the running equity peak.
          </p>
          <ReactECharts
            option={buildLineOptions(
              chartSeries.drawdownSeries,
              "#f97316",
              "rgba(249, 115, 22, 0.14)",
              "Drawdown",
            )}
            style={{ height: 280, width: "100%" }}
          />
        </section>
      </div>
    </div>
  );
}
