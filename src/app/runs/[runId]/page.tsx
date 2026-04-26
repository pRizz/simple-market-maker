import Link from "next/link";
import { notFound } from "next/navigation";

import { BacktestResultCharts } from "@/components/charts/backtest-result-charts";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Card, PageHeader, StatGrid } from "@/components/ui/shell";
import { StatCard } from "@/components/ui/stat-card";
import { getBuildSafeBacktestService } from "@/modules/backtests/server/build-safe-backtest-service";

type RunDetailPageProps = {
  params: Promise<{
    runId: string;
  }>;
};

type PersistedRunSummary = {
  averageDaysBetweenFills: number;
  endingPositionMarketValue: number;
  endingPositionQuantity: number;
  exposurePercent: number;
  fillCount: number;
  finalCash: number;
  finalEquity: number;
  maxDrawdownPercent: number;
  realizedProfitLoss: number;
  startingCapital: number;
  ticker: string;
  totalReturnPercent: number;
  unrealizedProfitLoss: number;
  winRatePercent: number;
};

type PersistedChartSeries = {
  drawdownSeries: Array<{ timestamp: string; value: number }>;
  equitySeries: Array<{ timestamp: string; value: number }>;
  fillMarkers: Array<{
    direction: "buy" | "sell";
    quantity: number;
    timestamp: string;
    value: number;
  }>;
  priceSeries: Array<{
    close: number;
    high: number;
    low: number;
    open: number;
    timestamp: string;
    volume: number;
  }>;
};

type PersistedFillEvent = {
  cashBalanceAfterFill: number;
  direction: "buy" | "sell";
  fees: number;
  levelIndex: number;
  occurredAt: string;
  positionQuantityAfterFill: number;
  price: number;
  quantity: number;
  realizedProfitLoss: number;
  referencePrice: number;
};

function formatNumber(maybeValue: number | null): string {
  if (maybeValue === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(maybeValue);
}

const fillColumns: DataTableColumn<PersistedFillEvent>[] = [
  {
    key: "occurredAt",
    label: "Date",
    render: (fillEvent) => new Date(fillEvent.occurredAt).toLocaleDateString(),
  },
  {
    key: "direction",
    label: "Side",
    render: (fillEvent) => fillEvent.direction,
  },
  {
    key: "price",
    label: "Price",
    render: (fillEvent) => `$${formatNumber(fillEvent.price)}`,
  },
  {
    key: "quantity",
    label: "Quantity",
    render: (fillEvent) => formatNumber(fillEvent.quantity),
  },
  {
    key: "fees",
    label: "Fees",
    render: (fillEvent) => `$${formatNumber(fillEvent.fees)}`,
  },
  {
    key: "realizedProfitLoss",
    label: "Realized",
    render: (fillEvent) => `$${formatNumber(fillEvent.realizedProfitLoss)}`,
  },
];

export default async function RunDetailPage({
  params,
}: RunDetailPageProps): Promise<React.JSX.Element> {
  const { runId } = await params;
  const backtestService = getBuildSafeBacktestService();
  const maybeRun = await backtestService.getRun(runId);

  if (!maybeRun) {
    notFound();
  }

  const maybeSummary = maybeRun.summaryJson
    ? (JSON.parse(maybeRun.summaryJson) as PersistedRunSummary)
    : null;
  const maybeChartSeries = maybeRun.chartSeriesJson
    ? (JSON.parse(maybeRun.chartSeriesJson) as PersistedChartSeries)
    : null;
  const fillEvents = maybeRun.fillEventsJson
    ? (JSON.parse(maybeRun.fillEventsJson) as PersistedFillEvent[])
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-200"
            href={
              maybeSummary ? `/backtests/${maybeRun.definitionId}` : "/backtests"
            }
          >
            Back to backtest
          </Link>
        }
        description="Inspect persisted ladder strategy run artifacts."
        eyebrow="Backtest run"
        title={`Run ${maybeRun.id.slice(0, 8)}`}
      />

      <StatGrid columns={4}>
        <StatCard
          detail={`Engine ${maybeRun.engineVersion}`}
          label="Status"
          value={maybeRun.status}
        />
        <StatCard
          detail={`Started ${new Date(maybeRun.startedAt).toLocaleString()}`}
          label="Final equity"
          value={`$${formatNumber(maybeRun.finalEquity)}`}
        />
        <StatCard
          detail="Persisted summary metric"
          label="Total return"
          value={`${formatNumber(maybeRun.totalReturnPercent)}%`}
        />
        <StatCard
          detail={`${maybeRun.tradeCount} trade levels filled`}
          label="Max drawdown"
          value={`${formatNumber(maybeRun.maxDrawdownPercent)}%`}
        />
      </StatGrid>

      {maybeSummary && maybeChartSeries ? (
        <>
          <BacktestResultCharts chartSeries={maybeChartSeries} />

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <h2 className="text-lg font-semibold text-white">Run summary</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Ticker", maybeSummary.ticker],
                  [
                    "Starting capital",
                    `$${formatNumber(maybeSummary.startingCapital)}`,
                  ],
                  [
                    "Ending position",
                    formatNumber(maybeSummary.endingPositionQuantity),
                  ],
                  [
                    "Ending market value",
                    `$${formatNumber(maybeSummary.endingPositionMarketValue)}`,
                  ],
                  [
                    "Realized PnL",
                    `$${formatNumber(maybeSummary.realizedProfitLoss)}`,
                  ],
                  [
                    "Unrealized PnL",
                    `$${formatNumber(maybeSummary.unrealizedProfitLoss)}`,
                  ],
                  [
                    "Win rate",
                    `${formatNumber(maybeSummary.winRatePercent)}%`,
                  ],
                  [
                    "Average days between fills",
                    formatNumber(maybeSummary.averageDaysBetweenFills),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-2 text-base font-medium text-slate-100">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            <DataTable
              columns={fillColumns}
              emptyMessage="No fill events were persisted for this run."
              rows={fillEvents}
            />
          </div>
        </>
      ) : (
        <Card className="border-red-400/20 bg-red-500/10 text-sm text-red-100">
          This run is missing persisted chart artifacts. It may have failed
          before completion.
        </Card>
      )}
    </div>
  );
}
