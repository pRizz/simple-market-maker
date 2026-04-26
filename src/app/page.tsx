import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState, PageHeader } from "@/components/ui/shell";
import { StatCard } from "@/components/ui/stat-card";
import { getBuildInfo } from "@/modules/build-info/build-info";
import type { BacktestRunRecord } from "@/modules/backtests/domain/backtest-definition";
import { getBuildSafeBacktestService } from "@/modules/backtests/server/build-safe-backtest-service";
import { getBuildSafeMarketDataService } from "@/modules/market-data/server/build-safe-market-data-service";

const recentRunColumns: DataTableColumn<BacktestRunRecord>[] = [
  {
    key: "run",
    label: "Run",
    render: (run) => (
      <Link
        className="font-semibold text-cyan-300 transition hover:text-cyan-200"
        href={`/runs/${run.id}`}
      >
        {run.id.slice(0, 8)}
      </Link>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (run) => <span className="capitalize">{run.status}</span>,
  },
  {
    key: "return",
    label: "Return",
    render: (run) =>
      run.totalReturnPercent === null
        ? "Unavailable"
        : `${run.totalReturnPercent.toFixed(2)}%`,
  },
  {
    key: "drawdown",
    label: "Drawdown",
    render: (run) =>
      run.maxDrawdownPercent === null
        ? "Unavailable"
        : `${run.maxDrawdownPercent.toFixed(2)}%`,
  },
  {
    key: "started",
    label: "Started",
    render: (run) => run.startedAt.toISOString().slice(0, 10),
  },
];

export default async function Home(): Promise<React.JSX.Element> {
  const buildInfo = getBuildInfo();
  const backtestService = getBuildSafeBacktestService();
  const marketDataService = getBuildSafeMarketDataService();
  const [backtests, recentRuns, marketDataChunks] = await Promise.all([
    backtestService.listBacktests(),
    backtestService.listRecentRuns(5),
    marketDataService.listChunks(),
  ]);
  const bestRun =
    recentRuns.length === 0
      ? null
      : [...recentRuns]
          .filter((run) => run.totalReturnPercent !== null)
          .sort(
            (leftRun, rightRun) =>
              (rightRun.totalReturnPercent ?? Number.NEGATIVE_INFINITY) -
              (leftRun.totalReturnPercent ?? Number.NEGATIVE_INFINITY),
          )[0] ?? null;
  const worstRun =
    recentRuns.length === 0
      ? null
      : [...recentRuns]
          .filter((run) => run.totalReturnPercent !== null)
          .sort(
            (leftRun, rightRun) =>
              (leftRun.totalReturnPercent ?? Number.POSITIVE_INFINITY) -
              (rightRun.totalReturnPercent ?? Number.POSITIVE_INFINITY),
          )[0] ?? null;

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16 sm:px-10">
        <PageHeader
          actions={
            <>
              <Link
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                href="/backtests"
              >
                Open backtests
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/10"
                href="/market-data"
              >
                Market data
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:text-cyan-200"
                href="/backtests/new"
              >
                Create first strategy
              </Link>
            </>
          }
          description="Create ladder strategy definitions, rerun them over persisted historical data, and review the resulting fills, equity curves, and drawdowns."
          eyebrow="Full-stack ladder strategy research workspace"
          title="Backtest stock ladder strategies with durable run history."
        />

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            detail="Definitions saved in Postgres."
            label="Saved backtests"
            value={backtests.length.toString()}
          />
          <StatCard
            detail="Downloaded ticker ranges ready for charting."
            label="Market chunks"
            value={marketDataChunks.length.toString()}
          />
          <StatCard
            detail="Best visible return in recent history."
            label="Best return"
            value={
              bestRun?.totalReturnPercent === null ||
              bestRun?.totalReturnPercent === undefined
                ? "Unavailable"
                : `${bestRun.totalReturnPercent.toFixed(2)}%`
            }
          />
          <StatCard
            detail="Worst visible return in recent history."
            label="Worst return"
            value={
              worstRun?.totalReturnPercent === null ||
              worstRun?.totalReturnPercent === undefined
                ? "Unavailable"
                : `${worstRun.totalReturnPercent.toFixed(2)}%`
            }
          />
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Recent runs</h2>
              <p className="text-sm text-slate-400">
                Review the latest persisted backtest executions and jump to full
                results.
              </p>
            </div>
            <div className="text-sm text-slate-400">
              Build {buildInfo.shortCommit} · {buildInfo.buildTime}
            </div>
          </div>

          {recentRuns.length === 0 ? (
            <EmptyState
              action={
                <Link
                  className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  href="/backtests/new"
                >
                  Create a backtest
                </Link>
              }
              description="No runs yet. Create a strategy and run it to populate the dashboard."
              title="No recent runs"
            />
          ) : (
            <DataTable
              columns={recentRunColumns}
              emptyMessage="No runs yet."
              rows={recentRuns}
            />
          )}
        </section>
      </main>
    </div>
  );
}
