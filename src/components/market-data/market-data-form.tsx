"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  marketDataIntervals,
  marketDataSources,
  toMarketDataChunkFormValues,
  type MarketDataChunkFormValues,
  type MarketDataChunkRecord,
  type MarketDataInterval,
  type MarketDataSource,
} from "@/modules/market-data/domain/market-data-chunk";

type MarketDataFormProps = {
  maybeChunk?: MarketDataChunkRecord;
};

type SubmissionState = {
  fieldErrors: Record<string, string>;
  formErrors: string[];
  status: "idle" | "submitting";
};

const defaultValues: MarketDataChunkFormValues = {
  ticker: "AAPL",
  source: "alpha_vantage",
  interval: "daily",
  startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

function inputClassName(hasError: boolean): string {
  return [
    "w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition",
    hasError
      ? "border-rose-400/60 focus:border-rose-300"
      : "border-white/10 focus:border-cyan-400/60",
  ].join(" ");
}

async function submitMarketDataChunk(
  body: MarketDataChunkFormValues,
): Promise<{
  chunkId?: string;
  fieldErrors: Record<string, string>;
  formErrors: string[];
  ok: boolean;
}> {
  const response = await fetch("/api/market-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseBody = (await response.json()) as {
    chunk?: { id: string };
    fieldErrors?: Record<string, string>;
    formErrors?: string[];
  };

  if (!response.ok || !responseBody.chunk?.id) {
    return {
      ok: false,
      fieldErrors: responseBody.fieldErrors ?? {},
      formErrors: responseBody.formErrors ?? ["Market data fetch failed."],
    };
  }

  return {
    ok: true,
    chunkId: responseBody.chunk.id,
    fieldErrors: {},
    formErrors: [],
  };
}

export function MarketDataForm({
  maybeChunk,
}: MarketDataFormProps): React.JSX.Element {
  const router = useRouter();
  const [formValues, setFormValues] = useState<MarketDataChunkFormValues>(
    maybeChunk ? toMarketDataChunkFormValues(maybeChunk) : defaultValues,
  );
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    fieldErrors: {},
    formErrors: [],
    status: "idle",
  });

  const updateField = <Key extends keyof MarketDataChunkFormValues>(
    fieldName: Key,
    value: MarketDataChunkFormValues[Key],
  ): void => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
    setSubmissionState((currentState) => ({
      ...currentState,
      fieldErrors: {
        ...currentState.fieldErrors,
        [fieldName]: "",
      },
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    setSubmissionState((currentState) => ({
      ...currentState,
      formErrors: [],
      status: "submitting",
    }));

    const result = await submitMarketDataChunk(formValues);

    if (!result.ok || !result.chunkId) {
      setSubmissionState({
        fieldErrors: result.fieldErrors,
        formErrors: result.formErrors,
        status: "idle",
      });
      return;
    }

    router.push(`/market-data/${result.chunkId}`);
    router.refresh();
  };

  const fieldErrors = submissionState.fieldErrors;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <form
        className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Ticker</span>
            <input
              className={inputClassName(Boolean(fieldErrors.ticker))}
              name="ticker"
              onChange={(event) =>
                updateField("ticker", event.target.value.toUpperCase())
              }
              value={formValues.ticker}
            />
            {fieldErrors.ticker ? (
              <p className="text-xs text-rose-300">{fieldErrors.ticker}</p>
            ) : null}
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Source</span>
            <select
              className={inputClassName(Boolean(fieldErrors.source))}
              name="source"
              onChange={(event) =>
                updateField(
                  "source",
                  event.target.value as MarketDataChunkFormValues["source"],
                )
              }
              value={formValues.source}
            >
              {marketDataSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            {fieldErrors.source ? (
              <p className="text-xs text-rose-300">{fieldErrors.source}</p>
            ) : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Start date</span>
            <input
              className={inputClassName(Boolean(fieldErrors.startDate))}
              name="startDate"
              onChange={(event) => updateField("startDate", event.target.value)}
              type="date"
              value={formValues.startDate}
            />
            {fieldErrors.startDate ? (
              <p className="text-xs text-rose-300">{fieldErrors.startDate}</p>
            ) : null}
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">End date</span>
            <input
              className={inputClassName(Boolean(fieldErrors.endDate))}
              name="endDate"
              onChange={(event) => updateField("endDate", event.target.value)}
              type="date"
              value={formValues.endDate}
            />
            {fieldErrors.endDate ? (
              <p className="text-xs text-rose-300">{fieldErrors.endDate}</p>
            ) : null}
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Interval</span>
            <select
              className={inputClassName(Boolean(fieldErrors.interval))}
              name="interval"
              onChange={(event) =>
                updateField(
                  "interval",
                  event.target.value as MarketDataChunkFormValues["interval"],
                )
              }
              value={formValues.interval}
            >
              {marketDataIntervals.map((interval) => (
                <option key={interval} value={interval}>
                  {interval}
                </option>
              ))}
            </select>
            {fieldErrors.interval ? (
              <p className="text-xs text-rose-300">{fieldErrors.interval}</p>
            ) : null}
          </label>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-200">Notes</span>
          <textarea
            className={inputClassName(Boolean(fieldErrors.notes))}
            name="notes"
            onChange={(event) => updateField("notes", event.target.value)}
            rows={6}
            value={formValues.notes}
          />
          {fieldErrors.notes ? (
            <p className="text-xs text-rose-300">{fieldErrors.notes}</p>
          ) : null}
        </label>

        {submissionState.formErrors.length > 0 ? (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {submissionState.formErrors.map((formError) => (
              <p key={formError}>{formError}</p>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/30"
            onClick={() => router.back()}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submissionState.status === "submitting"}
            type="submit"
          >
            {submissionState.status === "submitting"
              ? "Fetching..."
              : "Fetch and save data"}
          </button>
        </div>
      </form>

      <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            Data source notes
          </h2>
          <p className="text-sm leading-6 text-slate-300">
            Alpha Vantage fetches real daily OHLCV candles and requires
            <span className="font-mono text-cyan-200">
              {" "}
              ALPHA_VANTAGE_API_KEY
            </span>
            .
          </p>
          <p className="text-sm leading-6 text-slate-300">
            The free compact endpoint usually includes only the latest 100
            trading days, so start with recent ranges. Saved chunks prevent
            repeat API calls.
          </p>
          <p className="text-sm leading-6 text-slate-300">
            Use the sample source for deterministic local demos and tests.
          </p>
        </div>
      </aside>
    </div>
  );
}
