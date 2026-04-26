"use client";

import ReactECharts from "echarts-for-react";

import type { PriceSeriesPoint } from "@/modules/backtests/domain/candle";

type MarketDataChartsProps = {
  priceSeries: PriceSeriesPoint[];
  ticker: string;
};

function buildCandlestickOptions(priceSeries: PriceSeriesPoint[]) {
  return {
    animation: false,
    backgroundColor: "transparent",
    dataZoom: [
      {
        type: "inside",
      },
      {
        bottom: 8,
        height: 24,
        textStyle: {
          color: "#94a3b8",
        },
      },
    ],
    grid: {
      bottom: 64,
      left: 52,
      right: 20,
      top: 24,
    },
    series: [
      {
        data: priceSeries.map((point) => [
          point.open,
          point.close,
          point.low,
          point.high,
        ]),
        itemStyle: {
          borderColor: "#22c55e",
          borderColor0: "#ef4444",
          color: "#22c55e",
          color0: "#ef4444",
        },
        name: "OHLC",
        type: "candlestick",
      },
    ],
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      axisLabel: {
        color: "#94a3b8",
      },
      axisLine: {
        lineStyle: {
          color: "rgba(148, 163, 184, 0.2)",
        },
      },
      data: priceSeries.map((point) => point.timestamp),
      type: "category",
    },
    yAxis: {
      axisLabel: {
        color: "#94a3b8",
      },
      scale: true,
      splitLine: {
        lineStyle: {
          color: "rgba(148, 163, 184, 0.12)",
        },
      },
    },
  };
}

function buildCloseAndVolumeOptions(priceSeries: PriceSeriesPoint[]) {
  return {
    animation: false,
    backgroundColor: "transparent",
    grid: [
      {
        bottom: "36%",
        left: 52,
        right: 48,
        top: 24,
      },
      {
        bottom: 36,
        height: "22%",
        left: 52,
        right: 48,
      },
    ],
    series: [
      {
        data: priceSeries.map((point) => point.close),
        lineStyle: {
          color: "#38bdf8",
          width: 2,
        },
        name: "Close",
        showSymbol: false,
        smooth: true,
        type: "line",
        xAxisIndex: 0,
        yAxisIndex: 0,
      },
      {
        data: priceSeries.map((point) => point.volume),
        itemStyle: {
          color: "rgba(56, 189, 248, 0.5)",
        },
        name: "Volume",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
      },
    ],
    tooltip: {
      trigger: "axis",
    },
    xAxis: [
      {
        axisLabel: {
          color: "#94a3b8",
        },
        axisLine: {
          lineStyle: {
            color: "rgba(148, 163, 184, 0.2)",
          },
        },
        data: priceSeries.map((point) => point.timestamp),
        type: "category",
      },
      {
        axisLabel: {
          color: "#94a3b8",
        },
        axisLine: {
          lineStyle: {
            color: "rgba(148, 163, 184, 0.2)",
          },
        },
        data: priceSeries.map((point) => point.timestamp),
        gridIndex: 1,
        type: "category",
      },
    ],
    yAxis: [
      {
        axisLabel: {
          color: "#94a3b8",
        },
        scale: true,
        splitLine: {
          lineStyle: {
            color: "rgba(148, 163, 184, 0.12)",
          },
        },
        type: "value",
      },
      {
        axisLabel: {
          color: "#94a3b8",
        },
        gridIndex: 1,
        splitLine: {
          show: false,
        },
        type: "value",
      },
    ],
  };
}

export function MarketDataCharts({
  priceSeries,
  ticker,
}: MarketDataChartsProps): React.JSX.Element {
  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">
          {ticker} candlestick chart
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Daily open, high, low, and close candles for the downloaded range.
        </p>
        <ReactECharts
          option={buildCandlestickOptions(priceSeries)}
          style={{ height: 420, width: "100%" }}
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Close and volume</h2>
        <p className="mt-1 text-sm text-slate-400">
          Closing price trend with daily trading volume beneath it.
        </p>
        <ReactECharts
          option={buildCloseAndVolumeOptions(priceSeries)}
          style={{ height: 360, width: "100%" }}
        />
      </section>
    </div>
  );
}
