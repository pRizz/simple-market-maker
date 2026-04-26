import Link from "next/link";

import { getBuildInfo } from "@/modules/build-info/build-info";

const featureCards = [
  {
    title: "Saved backtests",
    description:
      "Create and version ladder strategy definitions with durable persistence in Postgres.",
  },
  {
    title: "Historical runs",
    description:
      "Store every rerun so you can compare results over time instead of losing prior simulations.",
  },
  {
    title: "Visual analytics",
    description:
      "Review price action, fills, equity curves, and drawdowns in polished charts and tables.",
  },
];

export default function Home(): React.JSX.Element {
  const buildInfo = getBuildInfo();

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16 sm:px-10">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
              Full-stack ladder strategy research workspace
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Backtest stock ladder strategies with a polished web app and
                durable run history.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                This app is built for creating ladder strategy definitions,
                rerunning them over historical data, and reviewing results with
                charts, metrics, and trade logs. It is designed to run locally
                in Docker or deploy cleanly to Railway.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                href="/backtests"
              >
                Open backtests
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:text-cyan-200"
                href="/backtests/new"
              >
                Create first strategy
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/30">
            <h2 className="text-lg font-semibold text-white">Build snapshot</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4">
                <dt>Version</dt>
                <dd className="font-mono text-slate-100">{buildInfo.version}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Commit</dt>
                <dd className="font-mono text-slate-100">
                  {buildInfo.shortCommit}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Built</dt>
                <dd className="font-mono text-slate-100">{buildInfo.buildTime}</dd>
              </div>
            </dl>
            <p className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
              The implementation follows Bright Builds guidance with a
              functional-core simulation engine, parse-at-the-boundary
              validation, and visible runtime provenance.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((featureCard) => (
            <article
              key={featureCard.title}
              className="rounded-3xl border border-white/10 bg-slate-900/70 p-6"
            >
              <h2 className="text-lg font-semibold text-white">
                {featureCard.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {featureCard.description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
