import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState, PageHeader } from "@/components/ui/shell";
import { StatCard } from "@/components/ui/stat-card";
import type { MarketDataChunkRecord } from "@/modules/market-data/domain/market-data-chunk";
import { getBuildSafeMarketDataService } from "@/modules/market-data/server/build-safe-market-data-service";
import { getMarketDataService } from "@/modules/market-data/server/service-singleton";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatSource(source: string): string {
  return source.replaceAll("_", " ");
}

const marketDataColumns: DataTableColumn<MarketDataChunkRecord>[] = [
  {
    key: "ticker",
    label: "Ticker",
    render: (chunk) => (
      <Link
        className="font-semibold text-cyan-300 transition hover:text-cyan-200"
        href={`/market-data/${chunk.id}`}
      >
        {chunk.ticker}
      </Link>
    ),
  },
  {
    key: "source",
    label: "Source",
    render: (chunk) => formatSource(chunk.source),
  },
  {
    key: "range",
    label: "Range",
    render: (chunk) =>
      `${formatDate(chunk.startDate)} → ${formatDate(chunk.endDate)}`,
  },
  {
    align: "right",
    key: "candles",
    label: "Candles",
    render: (chunk) => chunk.candleCount.toLocaleString(),
  },
  {
    key: "fetched",
    label: "Fetched",
    render: (chunk) => chunk.fetchedAt.toISOString().slice(0, 16).replace("T", " "),
  },
  {
    align: "right",
    key: "actions",
    label: "Actions",
    render: (chunk) => (
      <Link
        className="text-cyan-200 transition hover:text-cyan-100"
        href={`/market-data/${chunk.id}`}
      >
        View
      </Link>
    ),
  },
];

export default async function MarketDataPage(): Promise<React.JSX.Element> {
  const marketDataService = process.env.DATABASE_URL
    ? getMarketDataService()
    : getBuildSafeMarketDataService();
  const chunks = await marketDataService.listChunks();
  const candleCount = chunks.reduce(
    (totalCandles, chunk) => totalCandles + chunk.candleCount,
    0,
  );
  const maybeLatestChunk = chunks[0];

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            href="/market-data/new"
          >
            Fetch ticker data
          </Link>
        }
        description="Download daily OHLCV ticker ranges, persist them as reusable chunks, and inspect the candles before using them in strategy research."
        eyebrow="Market data"
        title="Downloaded ticker data"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          detail="Persisted ticker/date ranges"
          label="Data chunks"
          value={chunks.length.toString()}
        />
        <StatCard
          detail="Daily OHLCV rows stored"
          label="Candles"
          value={candleCount.toLocaleString()}
        />
        <StatCard
          detail={
            maybeLatestChunk
              ? `${formatSource(maybeLatestChunk.source)} · ${formatDate(
                  maybeLatestChunk.fetchedAt,
                )}`
              : "Fetch a chunk to populate this workspace"
          }
          label="Latest fetch"
          value={maybeLatestChunk ? maybeLatestChunk.ticker : "Unavailable"}
        />
      </section>

      {chunks.length === 0 ? (
        <EmptyState
          action={
            <Link
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              href="/market-data/new"
            >
              Fetch ticker data
            </Link>
          }
          description="No market data chunks exist yet. Fetch a ticker range from Alpha Vantage or generate a sample chunk for local testing."
          title="No downloaded data yet"
        />
      ) : (
        <DataTable
          columns={marketDataColumns}
          emptyMessage="No market data chunks yet."
          rows={chunks}
        />
      )}
    </div>
  );
}
