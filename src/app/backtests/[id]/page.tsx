import Link from "next/link";
import { notFound } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState, Shell } from "@/components/ui/shell";
import { StatCard } from "@/components/ui/stat-card";
import type { BacktestRunRecord } from "@/modules/backtests/domain/backtest-definition";
import { getBuildSafeBacktestService } from "@/modules/backtests/server/build-safe-backtest-service";
import { getBacktestService } from "@/modules/backtests/server/service-singleton";

type BacktestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RunHistoryRow = {
  actions: React.JSX.Element;
  finalEquity: string;
  startedAt: string;
  status: string;
  totalReturnPercent: string;
  tradeCount: string;
};

function currency(maybeValue: number | null): string {
  if (maybeValue === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(maybeValue);
}

function percent(maybeValue: number | null): string {
  if (maybeValue === null) {
    return "Unavailable";
  }

  return `${maybeValue.toFixed(2)}%`;
}

function buildRunHistoryRows(runs: BacktestRunRecord[]): RunHistoryRow[] {
  return runs.map((run) => ({
    actions: (
      <Link
        className="font-medium text-cyan-300 transition hover:text-cyan-200"
        href={`/runs/${run.id}`}
      >
        View run
      </Link>
    ),
    finalEquity: currency(run.finalEquity),
    startedAt: run.startedAt.toISOString().slice(0, 16).replace("T", " "),
    status: run.status,
    totalReturnPercent: percent(run.totalReturnPercent),
    tradeCount: run.tradeCount.toString(),
  }));
}

const runHistoryColumns: DataTableColumn<RunHistoryRow>[] = [
  {
    key: "startedAt",
    label: "Started",
    render: (row) => row.startedAt,
  },
  {
    key: "status",
    label: "Status",
    render: (row) => row.status,
  },
  {
    key: "finalEquity",
    label: "Final equity",
    render: (row) => row.finalEquity,
  },
  {
    key: "totalReturnPercent",
    label: "Return",
    render: (row) => row.totalReturnPercent,
  },
  {
    key: "tradeCount",
    label: "Trades",
    render: (row) => row.tradeCount,
  },
  {
    align: "right",
    key: "actions",
    label: "Actions",
    render: (row) => row.actions,
  },
];

export default async function BacktestDetailPage({
  params,
}: BacktestDetailPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const backtestService = process.env.DATABASE_URL
    ? getBacktestService()
    : getBuildSafeBacktestService();
  const maybeBacktest = await backtestService.getBacktest(id);

  if (!maybeBacktest) {
    notFound();
  }

  const runs = await backtestService.listRuns(maybeBacktest.id);
  const latestRun = runs[0] ?? null;

  return (
    <Shell
      actions={
        <>
          <Link
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            href={`/backtests/${maybeBacktest.id}/edit`}
          >
            Edit strategy
          </Link>
          <form action={`/api/backtests/${maybeBacktest.id}/run`} method="post">
            <button
              className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/10"
              type="submit"
            >
              Run now
            </button>
          </form>
        </>
      }
      description="Review saved parameters, inspect the latest run snapshot, and rerun the strategy against the persisted ladder configuration."
      eyebrow="Backtest detail"
      title={`${maybeBacktest.name} · ${maybeBacktest.ticker}`}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          detail="Running a backtest creates a durable run history entry."
          label="Latest status"
          value={latestRun ? latestRun.status : "No runs yet"}
        />
        <StatCard
          detail="Final simulated equity from the newest run."
          label="Latest equity"
          value={latestRun ? currency(latestRun.finalEquity) : "Unavailable"}
        />
        <StatCard
          detail="Percent return relative to starting capital."
          label="Latest return"
          value={
            latestRun ? percent(latestRun.totalReturnPercent) : "Unavailable"
          }
        />
        <StatCard
          detail="Maximum drawdown recorded during the latest run."
          label="Latest drawdown"
          value={
            latestRun ? percent(latestRun.maxDrawdownPercent) : "Unavailable"
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Run history</h2>
            <Link
              className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
              href="/backtests"
            >
              Back to all backtests
            </Link>
          </div>
          <div className="mt-6">
            {runs.length === 0 ? (
              <EmptyState
                description="Run the saved backtest to generate the first persisted result."
                title="No runs yet"
              />
            ) : (
              <DataTable
                columns={runHistoryColumns}
                emptyMessage="No runs yet."
                rows={buildRunHistoryRows(runs)}
              />
            )}
          </div>
        </article>

        <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Parameters</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <dt>Window</dt>
              <dd>
                {maybeBacktest.startDate.toISOString().slice(0, 10)} →{" "}
                {maybeBacktest.endDate.toISOString().slice(0, 10)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Capital</dt>
              <dd>{currency(maybeBacktest.startingCapital)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Increment</dt>
              <dd>{maybeBacktest.incrementPercent.toFixed(2)}%</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Bid / ask levels</dt>
              <dd>
                {maybeBacktest.bidLevels} / {maybeBacktest.askLevels}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Order sizing</dt>
              <dd>{maybeBacktest.orderSizeMode}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Order size</dt>
              <dd>{currency(maybeBacktest.orderSizeValue)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Max position</dt>
              <dd>{currency(maybeBacktest.maxPositionValue)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Fees</dt>
              <dd>{maybeBacktest.feesBps} bps</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Slippage</dt>
              <dd>{maybeBacktest.slippageBps} bps</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Fill policy</dt>
              <dd>{maybeBacktest.fillPolicy}</dd>
            </div>
          </dl>

          {maybeBacktest.notes ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-white">Notes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {maybeBacktest.notes}
              </p>
            </div>
          ) : null}
        </aside>
      </section>
    </Shell>
  );
}
