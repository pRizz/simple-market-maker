import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketDataCharts } from "@/components/charts/market-data-charts";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader, StatGrid } from "@/components/ui/shell";
import { StatCard } from "@/components/ui/stat-card";
import type { Candle } from "@/modules/backtests/domain/candle";
import {
  summarizeCandles,
  toPriceSeriesPoints,
} from "@/modules/market-data/domain/candle-series";
import { getBuildSafeMarketDataService } from "@/modules/market-data/server/build-safe-market-data-service";
import { getMarketDataService } from "@/modules/market-data/server/service-singleton";

type MarketDataDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(maybeValue: number | null): string {
  if (maybeValue === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(maybeValue);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

const candleColumns: DataTableColumn<Candle>[] = [
  {
    key: "date",
    label: "Date",
    render: (candle) => candle.occurredAt.toISOString().slice(0, 10),
  },
  {
    align: "right",
    key: "open",
    label: "Open",
    render: (candle) => formatCurrency(candle.open),
  },
  {
    align: "right",
    key: "high",
    label: "High",
    render: (candle) => formatCurrency(candle.high),
  },
  {
    align: "right",
    key: "low",
    label: "Low",
    render: (candle) => formatCurrency(candle.low),
  },
  {
    align: "right",
    key: "close",
    label: "Close",
    render: (candle) => formatCurrency(candle.close),
  },
  {
    align: "right",
    key: "volume",
    label: "Volume",
    render: (candle) => formatNumber(candle.volume),
  },
];

export default async function MarketDataDetailPage({
  params,
}: MarketDataDetailPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const marketDataService = process.env.DATABASE_URL
    ? getMarketDataService()
    : getBuildSafeMarketDataService();
  const maybeChunk = await marketDataService.getChunk(id);

  if (!maybeChunk) {
    notFound();
  }

  const summary = summarizeCandles(maybeChunk.candles);
  const priceSeries = toPriceSeriesPoints(maybeChunk.candles);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-200"
              href="/market-data"
            >
              Back to chunks
            </Link>
            <form action={`/api/market-data/${maybeChunk.id}/delete`} method="post">
              <button
                className="inline-flex items-center justify-center rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-300 hover:bg-rose-400/10"
                type="submit"
              >
                Delete chunk
              </button>
            </form>
          </>
        }
        description="Inspect the downloaded OHLCV candles for this ticker range."
        eyebrow="Market data chunk"
        title={`${maybeChunk.ticker} · ${maybeChunk.startDate.toISOString().slice(0, 10)} to ${maybeChunk.endDate.toISOString().slice(0, 10)}`}
      />

      <StatGrid columns={4}>
        <StatCard
          detail={`Source ${maybeChunk.source}`}
          label="Ticker"
          value={maybeChunk.ticker}
        />
        <StatCard
          detail={`Interval ${maybeChunk.interval}`}
          label="Candles"
          value={String(maybeChunk.candleCount)}
        />
        <StatCard
          detail={`Fetched ${maybeChunk.fetchedAt.toISOString().slice(0, 10)}`}
          label="Close range"
          value={`${formatCurrency(summary.firstClose)} → ${formatCurrency(summary.lastClose)}`}
        />
        <StatCard
          detail={`${formatNumber(summary.totalVolume)} shares across chunk`}
          label="High / low"
          value={`${formatCurrency(summary.high)} / ${formatCurrency(summary.low)}`}
        />
      </StatGrid>

      <MarketDataCharts priceSeries={priceSeries} ticker={maybeChunk.ticker} />

      {maybeChunk.notes ? (
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Notes</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            {maybeChunk.notes}
          </p>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Candles</h2>
          <p className="mt-1 text-sm text-slate-400">
            Stored daily OHLCV rows for this data chunk.
          </p>
        </div>
        <DataTable
          columns={candleColumns}
          emptyMessage="No candles were stored for this chunk."
          rows={maybeChunk.candles}
        />
      </section>
    </div>
  );
}
