import { z } from "zod";

export const providerIds = ["alpha_vantage", "sample", "twelve_data"] as const;
export const selectableDefaultProviderIds = ["alpha_vantage"] as const;
export const missingDataBehaviors = [
  "confirm_before_fetch",
  "silent_fetch",
] as const;

export type ProviderId = (typeof providerIds)[number];
export type DefaultProviderId = (typeof selectableDefaultProviderIds)[number];
export type MissingDataBehavior = (typeof missingDataBehaviors)[number];

export type AppSettings = {
  defaultProvider: DefaultProviderId;
  missingDataBehavior: MissingDataBehavior;
  showSampleData: boolean;
};

export const defaultAppSettings: AppSettings = {
  defaultProvider: "alpha_vantage",
  missingDataBehavior: "confirm_before_fetch",
  showSampleData: false,
};

const appSettingsFieldNames = [
  "defaultProvider",
  "missingDataBehavior",
  "showSampleData",
] as const;

type AppSettingsFieldName = (typeof appSettingsFieldNames)[number];

const rawAppSettingsSchema = z.object({
  defaultProvider: z.enum(selectableDefaultProviderIds),
  missingDataBehavior: z.enum(missingDataBehaviors),
  showSampleData: z.boolean(),
});

export type RawAppSettingsInput = z.input<typeof rawAppSettingsSchema>;

export type ParsedAppSettingsResult =
  | {
      ok: true;
      value: AppSettings;
    }
  | {
      ok: false;
      fieldErrors: Partial<Record<AppSettingsFieldName, string>>;
      formErrors: string[];
    };

export function isSelectableDefaultProviderId(
  value: string,
): value is DefaultProviderId {
  return selectableDefaultProviderIds.includes(value as DefaultProviderId);
}

function fieldErrorsFromZodError(
  flattenedErrors: Record<string, string[] | undefined>,
): Partial<Record<AppSettingsFieldName, string>> {
  return Object.fromEntries(
    Object.entries(flattenedErrors).flatMap(([fieldName, messages]) => {
      const maybeMessage = messages?.[0];

      if (!maybeMessage) {
        return [];
      }

      if (!appSettingsFieldNames.includes(fieldName as AppSettingsFieldName)) {
        return [];
      }

      return [[fieldName, maybeMessage]];
    }),
  ) as Partial<Record<AppSettingsFieldName, string>>;
}

export function maybeParseAppSettingsInput(
  rawInput: RawAppSettingsInput,
): ParsedAppSettingsResult {
  const parsedSchema = rawAppSettingsSchema.safeParse(rawInput);

  if (!parsedSchema.success) {
    const flattened = parsedSchema.error.flatten();

    return {
      ok: false,
      fieldErrors: fieldErrorsFromZodError(flattened.fieldErrors),
      formErrors: flattened.formErrors,
    };
  }

  return {
    ok: true,
    value: parsedSchema.data,
  };
}
