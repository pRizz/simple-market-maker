import { z } from "zod";

import {
  backtestDefinitionFieldNames,
  fillPolicies,
  normalizeNotes,
  orderSizeModes,
  type BacktestDefinitionDraft,
  type BacktestDefinitionFieldName,
} from "@/modules/backtests/domain/backtest-definition";
import {
  maxBacktestNotesLength,
  maxLadderLevels,
} from "@/modules/backtests/domain/constants";

const rawBacktestDefinitionSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  ticker: z
    .string()
    .trim()
    .min(1, "Ticker is required.")
    .max(10, "Ticker must be 10 characters or less.")
    .transform((value) => value.toUpperCase()),
  startDate: z.string().trim().min(1, "Start date is required."),
  endDate: z.string().trim().min(1, "End date is required."),
  startingCapital: z.coerce
    .number()
    .positive("Starting capital must be positive."),
  incrementPercent: z.coerce
    .number()
    .gt(0, "Increment percent must be greater than zero.")
    .max(100, "Increment percent must be 100 or less."),
  bidLevels: z.coerce
    .number()
    .int()
    .min(1, "Bid levels must be at least 1.")
    .max(maxLadderLevels, `Bid levels must be ${maxLadderLevels} or less.`),
  askLevels: z.coerce
    .number()
    .int()
    .min(1, "Ask levels must be at least 1.")
    .max(maxLadderLevels, `Ask levels must be ${maxLadderLevels} or less.`),
  orderSizeMode: z.enum(orderSizeModes),
  orderSizeValue: z.coerce
    .number()
    .positive("Order size value must be greater than zero."),
  maxPositionValue: z.coerce
    .number()
    .positive("Max position value must be greater than zero."),
  feesBps: z.coerce
    .number()
    .min(0, "Fees cannot be negative.")
    .max(10_000, "Fees must be 10,000 bps or less."),
  slippageBps: z.coerce
    .number()
    .min(0, "Slippage cannot be negative.")
    .max(10_000, "Slippage must be 10,000 bps or less."),
  fillPolicy: z.enum(fillPolicies),
  notes: z
    .string()
    .max(
      maxBacktestNotesLength,
      `Notes must be ${maxBacktestNotesLength} characters or less.`,
    )
    .optional()
    .default(""),
});

export type RawBacktestDefinitionInput = z.input<
  typeof rawBacktestDefinitionSchema
>;

export type ParsedBacktestDefinitionResult =
  | {
      ok: true;
      value: BacktestDefinitionDraft;
    }
  | {
      ok: false;
      fieldErrors: Partial<Record<BacktestDefinitionFieldName, string>>;
      formErrors: string[];
    };

function parseDate(dateValue: string, label: string): Date {
  const parsedDate = new Date(`${dateValue}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${label} is invalid.`);
  }

  return parsedDate;
}

function fieldErrorsFromZodError(
  flattenedErrors: Record<string, string[] | undefined>,
): Partial<Record<BacktestDefinitionFieldName, string>> {
  return Object.fromEntries(
    Object.entries(flattenedErrors).flatMap(([fieldName, messages]) => {
      const maybeMessage = messages?.[0];

      if (!maybeMessage) {
        return [];
      }

      if (
        !backtestDefinitionFieldNames.includes(
          fieldName as BacktestDefinitionFieldName,
        )
      ) {
        return [];
      }

      return [[fieldName, maybeMessage]];
    }),
  ) as Partial<Record<BacktestDefinitionFieldName, string>>;
}

export function maybeParseBacktestDefinition(
  rawInput: RawBacktestDefinitionInput,
): ParsedBacktestDefinitionResult {
  const parsedSchema = rawBacktestDefinitionSchema.safeParse(rawInput);

  if (!parsedSchema.success) {
    const flattened = parsedSchema.error.flatten();

    return {
      ok: false,
      fieldErrors: fieldErrorsFromZodError(flattened.fieldErrors),
      formErrors: flattened.formErrors,
    };
  }

  try {
    const parsedStartDate = parseDate(parsedSchema.data.startDate, "Start date");
    const parsedEndDate = parseDate(parsedSchema.data.endDate, "End date");

    if (parsedEndDate < parsedStartDate) {
      return {
        ok: false,
        fieldErrors: {
          endDate: "End date must be on or after the start date.",
        },
        formErrors: [],
      };
    }

    if (parsedSchema.data.maxPositionValue < parsedSchema.data.orderSizeValue) {
      return {
        ok: false,
        fieldErrors: {
          maxPositionValue:
            "Max position value must be at least the order size value.",
        },
        formErrors: [],
      };
    }

    return {
      ok: true,
      value: {
        name: parsedSchema.data.name,
        ticker: parsedSchema.data.ticker,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        startingCapital: parsedSchema.data.startingCapital,
        incrementPercent: parsedSchema.data.incrementPercent,
        bidLevels: parsedSchema.data.bidLevels,
        askLevels: parsedSchema.data.askLevels,
        orderSizeMode: parsedSchema.data.orderSizeMode,
        orderSizeValue: parsedSchema.data.orderSizeValue,
        maxPositionValue: parsedSchema.data.maxPositionValue,
        feesBps: parsedSchema.data.feesBps,
        slippageBps: parsedSchema.data.slippageBps,
        fillPolicy: parsedSchema.data.fillPolicy,
        notes: normalizeNotes(parsedSchema.data.notes),
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backtest definition is invalid.";

    return {
      ok: false,
      fieldErrors: {},
      formErrors: [message],
    };
  }
}
