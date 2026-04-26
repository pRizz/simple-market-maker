import { z } from "zod";

import {
  marketDataIntervals,
  marketDataSources,
  maxMarketDataNotesLength,
  normalizeMarketDataNotes,
  normalizeTicker,
  type MarketDataChunkDraft,
  type MarketDataChunkFieldName,
} from "@/modules/market-data/domain/market-data-chunk";

const marketDataChunkFieldNames = [
  "ticker",
  "source",
  "interval",
  "startDate",
  "endDate",
  "notes",
] as const satisfies readonly MarketDataChunkFieldName[];

const rawMarketDataChunkSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, "Ticker is required.")
    .max(15, "Ticker must be 15 characters or less.")
    .transform(normalizeTicker),
  source: z.enum(marketDataSources),
  interval: z.enum(marketDataIntervals),
  startDate: z.string().trim().min(1, "Start date is required."),
  endDate: z.string().trim().min(1, "End date is required."),
  notes: z
    .string()
    .max(
      maxMarketDataNotesLength,
      `Notes must be ${maxMarketDataNotesLength} characters or less.`,
    )
    .optional()
    .default(""),
});

export type RawMarketDataChunkInput = z.input<
  typeof rawMarketDataChunkSchema
>;

export type ParsedMarketDataChunkResult =
  | {
      ok: true;
      value: MarketDataChunkDraft;
    }
  | {
      ok: false;
      fieldErrors: Partial<Record<MarketDataChunkFieldName, string>>;
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
): Partial<Record<MarketDataChunkFieldName, string>> {
  return Object.fromEntries(
    Object.entries(flattenedErrors).flatMap(([fieldName, messages]) => {
      const maybeMessage = messages?.[0];

      if (!maybeMessage) {
        return [];
      }

      if (!marketDataChunkFieldNames.includes(fieldName as MarketDataChunkFieldName)) {
        return [];
      }

      return [[fieldName, maybeMessage]];
    }),
  ) as Partial<Record<MarketDataChunkFieldName, string>>;
}

export function maybeParseMarketDataChunk(
  rawInput: RawMarketDataChunkInput,
): ParsedMarketDataChunkResult {
  const parsedSchema = rawMarketDataChunkSchema.safeParse(rawInput);

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

    return {
      ok: true,
      value: {
        ticker: parsedSchema.data.ticker,
        source: parsedSchema.data.source,
        interval: parsedSchema.data.interval,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        notes: normalizeMarketDataNotes(parsedSchema.data.notes),
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Market data request is invalid.";

    return {
      ok: false,
      fieldErrors: {},
      formErrors: [message],
    };
  }
}
