import { z } from "zod";

import {
  fillPolicies,
  orderSizeModes,
} from "@/modules/backtests/domain/backtest-definition";
import {
  maxBacktestNotesLength,
  maxLadderLevels,
} from "@/modules/backtests/domain/constants";

export const backtestFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  ticker: z.string().trim().min(1, "Ticker is required.").max(10),
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

export type BacktestFormValues = z.infer<typeof backtestFormSchema>;
