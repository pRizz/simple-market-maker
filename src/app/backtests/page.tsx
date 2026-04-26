import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { EmptyState, PageHeader } from "@/components/ui/shell";
import { StatCard } from "@/components/ui/stat-card";
import {
  formatBacktestLabel,
  type BacktestDefinitionRecord,
  type BacktestRunRecord,
} from "@/modules/backtests/domain/backtest-definition";
import { getBacktestService } from "@/modules/backtests/server/service-singleton";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function latestReturnValue(maybeRun: BacktestRunRecord | undefined): string {
  if (
    maybeRun?.totalReturnPercent === null ||
    maybeRun?.totalReturnPercent === undefined
  ) {
    return "Unavailable";
  }

  return `${maybeRun.totalReturnPercent.toFixed(2)}%`;
}

export default async function BacktestsPage(): Promise<React.JSX.Element> {
  const backtestService = getBacktestService();
  const [backtests, recentRuns] = await Promise.all([
    backtestService.listBacktests(),
    backtestService.listRecentRuns(5),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            href="/backtests/new"
          >
            New backtest
          </Link>
        }
        description="Create, review, and rerun persisted ladder strategy definitions."
        eyebrow="Workspace"
        title="Backtests"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          detail="Definitions persisted in Postgres"
          label="Saved backtests"
          value={String(backtests.length)}
        />
        <StatCard
          detail="Most recent run entries"
          label="Recent runs"
          value={String(recentRuns.length)}
        />
        <StatCard
          detail="From the latest completed run"
          label="Latest run return"
          value={latestReturnValue(recentRuns[0])}
        />
      </section>

      {backtests.length === 0 ? (
        <EmptyState
          action={
            <Link
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              href="/backtests/new"
            >
              Create your first backtest
            </Link>
          }
          description="No backtests exist yet. Start by defining a ladder strategy with capital, ladder spacing, and risk controls."
          title="No backtests saved yet"
        />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <DataTable<BacktestDefinitionRecord>
            columns={[
              {
                key: "backtest",
                label: "Backtest",
                render: (backtest) => (
                  <Link
                    className="font-semibold text-cyan-300 transition hover:text-cyan-200"
                    href={`/backtests/${backtest.id}`}
                  >
                    {formatBacktestLabel(backtest)}
                  </Link>
                ),
              },
              {
                key: "ticker",
                label: "Ticker",
                render: (backtest) => backtest.ticker,
              },
              {
                align: "right",
                key: "starting-capital",
                label: "Starting capital",
                render: (backtest) => formatCurrency(backtest.startingCapital),
              },
              {
                key: "levels",
                label: "Levels",
                render: (backtest) =>
                  `${backtest.bidLevels} bids / ${backtest.askLevels} asks`,
              },
              {
                align: "right",
                key: "actions",
                label: "Actions",
                render: (backtest) => (
                  <div className="flex justify-end gap-3">
                    <Link
                      className="text-cyan-200 transition hover:text-cyan-100"
                      href={`/backtests/${backtest.id}`}
                    >
                      View
                    </Link>
                    <Link
                      className="text-cyan-200 transition hover:text-cyan-100"
                      href={`/backtests/${backtest.id}/edit`}
                    >
                      Edit
                    </Link>
                  </div>
                ),
              },
            ]}
            emptyMessage="No backtests yet. Create your first ladder strategy to get started."
            rows={backtests}
          />

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Latest runs</h2>
            <div className="mt-4 space-y-3">
              {recentRuns.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No runs yet. Execute a backtest after creating one.
                </p>
              ) : (
                recentRuns.map((run) => (
                  <Link
                    key={run.id}
                    className="block rounded-2xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-cyan-400/40"
                    href={`/runs/${run.id}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-slate-100">
                        {run.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {run.startedAt.toISOString().slice(0, 10)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      Return: {latestReturnValue(run)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
