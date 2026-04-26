import {
  maxBacktestNotesLength,
  roundCurrency,
} from "@/modules/backtests/domain/constants";

export const orderSizeModes = ["fixed_amount", "percent_of_capital"] as const;
export const fillPolicies = ["buy-first", "sell-first"] as const;

export const backtestDefinitionFieldNames = [
  "name",
  "ticker",
  "startDate",
  "endDate",
  "startingCapital",
  "incrementPercent",
  "bidLevels",
  "askLevels",
  "orderSizeMode",
  "orderSizeValue",
  "maxPositionValue",
  "feesBps",
  "slippageBps",
  "fillPolicy",
  "notes",
] as const;

export type OrderSizeMode = (typeof orderSizeModes)[number];
export type FillPolicy = (typeof fillPolicies)[number];
export type BacktestDefinitionFieldName =
  (typeof backtestDefinitionFieldNames)[number];

export type BacktestDefinitionDraft = {
  name: string;
  ticker: string;
  startDate: Date;
  endDate: Date;
  startingCapital: number;
  incrementPercent: number;
  bidLevels: number;
  askLevels: number;
  orderSizeMode: OrderSizeMode;
  orderSizeValue: number;
  maxPositionValue: number;
  feesBps: number;
  slippageBps: number;
  fillPolicy: FillPolicy;
  notes: string;
};

export type BacktestDefinitionRecord = BacktestDefinitionDraft & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BacktestRunStatus = "running" | "completed" | "failed";

export type BacktestRunRecord = {
  id: string;
  definitionId: string;
  status: BacktestRunStatus;
  engineVersion: string;
  startedAt: Date;
  completedAt: Date | null;
  finalEquity: number | null;
  totalReturnPercent: number | null;
  maxDrawdownPercent: number | null;
  tradeCount: number;
  errorMessage: string | null;
  summaryJson: string | null;
  chartSeriesJson: string | null;
  fillEventsJson: string | null;
  priceSeriesJson: string | null;
  createdAt: Date;
};

export type BacktestDefinitionFormValues = {
  name: string;
  ticker: string;
  startDate: string;
  endDate: string;
  startingCapital: number;
  incrementPercent: number;
  bidLevels: number;
  askLevels: number;
  orderSizeMode: OrderSizeMode;
  orderSizeValue: number;
  maxPositionValue: number;
  feesBps: number;
  slippageBps: number;
  fillPolicy: FillPolicy;
  notes: string;
};

export function formatBacktestLabel(
  definition: Pick<BacktestDefinitionRecord, "name" | "ticker">,
): string {
  return `${definition.name} (${definition.ticker})`;
}

export function orderNotionalValue(
  definition: Pick<
    BacktestDefinitionDraft,
    "orderSizeMode" | "orderSizeValue" | "startingCapital"
  >,
): number {
  if (definition.orderSizeMode === "fixed_amount") {
    return roundCurrency(definition.orderSizeValue);
  }

  return roundCurrency(
    definition.startingCapital * (definition.orderSizeValue / 100),
  );
}

export function toBacktestDefinitionFormValues(
  definition: BacktestDefinitionDraft,
): BacktestDefinitionFormValues {
  return {
    name: definition.name,
    ticker: definition.ticker,
    startDate: definition.startDate.toISOString().slice(0, 10),
    endDate: definition.endDate.toISOString().slice(0, 10),
    startingCapital: definition.startingCapital,
    incrementPercent: definition.incrementPercent,
    bidLevels: definition.bidLevels,
    askLevels: definition.askLevels,
    orderSizeMode: definition.orderSizeMode,
    orderSizeValue: definition.orderSizeValue,
    maxPositionValue: definition.maxPositionValue,
    feesBps: definition.feesBps,
    slippageBps: definition.slippageBps,
    fillPolicy: definition.fillPolicy,
    notes: definition.notes,
  };
}

export function normalizeNotes(value: string): string {
  return value.trim().slice(0, maxBacktestNotesLength);
}
