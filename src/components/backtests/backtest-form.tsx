"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  fillPolicies,
  orderSizeModes,
  toBacktestDefinitionFormValues,
  type BacktestDefinitionFormValues,
  type BacktestDefinitionRecord,
} from "@/modules/backtests/domain/backtest-definition";
import {
  createAskLevels,
  createBidLevels,
  ladderPreviewRows,
} from "@/modules/backtests/domain/ladder-level";

type BacktestFormProps = {
  mode: "create" | "edit";
  maybeDefinition?: BacktestDefinitionRecord;
};

const defaultValues: BacktestDefinitionFormValues = {
  name: "",
  ticker: "AAPL",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  startingCapital: 10_000,
  incrementPercent: 2,
  bidLevels: 4,
  askLevels: 4,
  orderSizeMode: "fixed_amount",
  orderSizeValue: 1_000,
  maxPositionValue: 5_000,
  feesBps: 10,
  slippageBps: 5,
  fillPolicy: "buy-first",
  notes: "",
};

type SubmissionState = {
  fieldErrors: Record<string, string>;
  formErrors: string[];
  status: "idle" | "submitting";
};

function inputClassName(hasError: boolean): string {
  return [
    "w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition",
    hasError
      ? "border-rose-400/60 focus:border-rose-300"
      : "border-white/10 focus:border-cyan-400/60",
  ].join(" ");
}

function numericValue(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

async function submitBacktest(input: {
  body: BacktestDefinitionFormValues;
  id?: string;
  mode: "create" | "edit";
}): Promise<{
  backtestId?: string;
  fieldErrors: Record<string, string>;
  formErrors: string[];
  ok: boolean;
}> {
  const endpoint =
    input.mode === "create"
      ? "/api/backtests"
      : `/api/backtests/${input.id ?? ""}`;

  const response = await fetch(endpoint, {
    method: input.mode === "create" ? "POST" : "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input.body),
  });

  const responseBody = (await response.json()) as {
    backtest?: { id: string };
    fieldErrors?: Record<string, string>;
    formErrors?: string[];
  };

  if (!response.ok || !responseBody.backtest?.id) {
    return {
      ok: false,
      fieldErrors: responseBody.fieldErrors ?? {},
      formErrors: responseBody.formErrors ?? ["Backtest save failed."],
    };
  }

  return {
    ok: true,
    backtestId: responseBody.backtest.id,
    fieldErrors: {},
    formErrors: [],
  };
}

export function BacktestForm({
  mode,
  maybeDefinition,
}: BacktestFormProps): React.JSX.Element {
  const router = useRouter();
  const [formValues, setFormValues] = useState<BacktestDefinitionFormValues>(
    maybeDefinition ? toBacktestDefinitionFormValues(maybeDefinition) : defaultValues,
  );
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    fieldErrors: {},
    formErrors: [],
    status: "idle",
  });

  const ladderPreview = useMemo(() => {
    const referencePrice =
      formValues.orderSizeMode === "percent_of_capital"
        ? formValues.startingCapital / 100
        : formValues.orderSizeValue;

    const bidLevels = createBidLevels({
      incrementPercent: formValues.incrementPercent,
      levelCount: formValues.bidLevels,
      referencePrice,
    });
    const askLevels = createAskLevels({
      incrementPercent: formValues.incrementPercent,
      levelCount: formValues.askLevels,
      referencePrice,
    });

    return ladderPreviewRows({ askLevels, bidLevels });
  }, [formValues]);

  const updateField = <Key extends keyof BacktestDefinitionFormValues>(
    fieldName: Key,
    value: BacktestDefinitionFormValues[Key],
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

    const result = await submitBacktest({
      body: formValues,
      id: maybeDefinition?.id,
      mode,
    });

    if (!result.ok || !result.backtestId) {
      setSubmissionState({
        fieldErrors: result.fieldErrors,
        formErrors: result.formErrors,
        status: "idle",
      });
      return;
    }

    router.push(`/backtests/${result.backtestId}`);
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
            <span className="font-medium text-slate-200">Name</span>
            <input
              className={inputClassName(Boolean(fieldErrors.name))}
              name="name"
              onChange={(event) => updateField("name", event.target.value)}
              value={formValues.name}
            />
            {fieldErrors.name ? (
              <p className="text-xs text-rose-300">{fieldErrors.name}</p>
            ) : null}
          </label>

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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Starting capital</span>
            <input
              className={inputClassName(Boolean(fieldErrors.startingCapital))}
              name="startingCapital"
              onChange={(event) =>
                updateField("startingCapital", numericValue(event.target.value))
              }
              step="0.01"
              type="number"
              value={formValues.startingCapital}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Increment %</span>
            <input
              className={inputClassName(Boolean(fieldErrors.incrementPercent))}
              name="incrementPercent"
              onChange={(event) =>
                updateField("incrementPercent", numericValue(event.target.value))
              }
              step="0.1"
              type="number"
              value={formValues.incrementPercent}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Max position value</span>
            <input
              className={inputClassName(Boolean(fieldErrors.maxPositionValue))}
              name="maxPositionValue"
              onChange={(event) =>
                updateField("maxPositionValue", numericValue(event.target.value))
              }
              step="0.01"
              type="number"
              value={formValues.maxPositionValue}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Bid levels</span>
            <input
              className={inputClassName(Boolean(fieldErrors.bidLevels))}
              name="bidLevels"
              onChange={(event) =>
                updateField("bidLevels", numericValue(event.target.value))
              }
              type="number"
              value={formValues.bidLevels}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Ask levels</span>
            <input
              className={inputClassName(Boolean(fieldErrors.askLevels))}
              name="askLevels"
              onChange={(event) =>
                updateField("askLevels", numericValue(event.target.value))
              }
              type="number"
              value={formValues.askLevels}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Fees (bps)</span>
            <input
              className={inputClassName(Boolean(fieldErrors.feesBps))}
              name="feesBps"
              onChange={(event) =>
                updateField("feesBps", numericValue(event.target.value))
              }
              type="number"
              value={formValues.feesBps}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Slippage (bps)</span>
            <input
              className={inputClassName(Boolean(fieldErrors.slippageBps))}
              name="slippageBps"
              onChange={(event) =>
                updateField("slippageBps", numericValue(event.target.value))
              }
              type="number"
              value={formValues.slippageBps}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Order size mode</span>
            <select
              className={inputClassName(Boolean(fieldErrors.orderSizeMode))}
              name="orderSizeMode"
              onChange={(event) =>
                updateField(
                  "orderSizeMode",
                  event.target.value as BacktestDefinitionFormValues["orderSizeMode"],
                )
              }
              value={formValues.orderSizeMode}
            >
              {orderSizeModes.map((orderSizeMode) => (
                <option key={orderSizeMode} value={orderSizeMode}>
                  {orderSizeMode}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Order size value</span>
            <input
              className={inputClassName(Boolean(fieldErrors.orderSizeValue))}
              name="orderSizeValue"
              onChange={(event) =>
                updateField("orderSizeValue", numericValue(event.target.value))
              }
              step="0.01"
              type="number"
              value={formValues.orderSizeValue}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-200">Fill policy</span>
            <select
              className={inputClassName(Boolean(fieldErrors.fillPolicy))}
              name="fillPolicy"
              onChange={(event) =>
                updateField(
                  "fillPolicy",
                  event.target.value as BacktestDefinitionFormValues["fillPolicy"],
                )
              }
              value={formValues.fillPolicy}
            >
              {fillPolicies.map((fillPolicy) => (
                <option key={fillPolicy} value={fillPolicy}>
                  {fillPolicy}
                </option>
              ))}
            </select>
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
              ? "Saving..."
              : mode === "create"
                ? "Create backtest"
                : "Save changes"}
          </button>
        </div>
      </form>

      <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Ladder preview</h2>
          <p className="text-sm text-slate-300">
            Quick visual check of the surrounding bid and ask levels.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-950/70 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Level</th>
                <th className="px-4 py-3 text-left font-medium">Bid</th>
                <th className="px-4 py-3 text-left font-medium">Ask</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {ladderPreview.map((row) => (
                <tr key={row.label} className="bg-slate-950/50">
                  <td className="px-4 py-3 text-slate-200">{row.label}</td>
                  <td className="px-4 py-3 text-emerald-300">
                    {row.maybeBidPrice === null
                      ? "—"
                      : `$${row.maybeBidPrice.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-amber-300">
                    {row.maybeAskPrice === null
                      ? "—"
                      : `$${row.maybeAskPrice.toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>
    </div>
  );
}
