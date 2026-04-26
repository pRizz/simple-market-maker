import "server-only";

import { eq } from "drizzle-orm";

import { getDbOrThrow } from "@/modules/db/client";
import { appSettingsTable } from "@/modules/db/schema";
import {
  defaultAppSettings,
  maybeParseAppSettingsInput,
  type AppSettings,
  type RawAppSettingsInput,
} from "@/modules/settings/domain/app-settings";

const appSettingsId = "singleton";

type AppSettingsRow = typeof appSettingsTable.$inferSelect;

function mapAppSettingsRow(row: AppSettingsRow): AppSettings {
  const rawSettings = {
    defaultProvider: row.defaultProvider,
    missingDataBehavior: row.missingDataBehavior,
    showSampleData: row.showSampleData,
  } as unknown as RawAppSettingsInput;
  const parsedSettings = maybeParseAppSettingsInput(rawSettings);

  if (!parsedSettings.ok) {
    throw new Error("Persisted app settings are invalid.");
  }

  return parsedSettings.value;
}

export type AppSettingsRepository = ReturnType<
  typeof createAppSettingsRepository
>;

export function createAppSettingsRepository() {
  async function getOrCreateSettings(): Promise<AppSettings> {
    const [maybeExistingRow] = await getDbOrThrow()
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.id, appSettingsId))
      .limit(1);

    if (maybeExistingRow) {
      return mapAppSettingsRow(maybeExistingRow);
    }

    const [maybeInsertedRow] = await getDbOrThrow()
      .insert(appSettingsTable)
      .values({
        id: appSettingsId,
        defaultProvider: defaultAppSettings.defaultProvider,
        missingDataBehavior: defaultAppSettings.missingDataBehavior,
        showSampleData: defaultAppSettings.showSampleData,
      })
      .onConflictDoNothing({ target: appSettingsTable.id })
      .returning();

    if (maybeInsertedRow) {
      return mapAppSettingsRow(maybeInsertedRow);
    }

    const [row] = await getDbOrThrow()
      .select()
      .from(appSettingsTable)
      .where(eq(appSettingsTable.id, appSettingsId))
      .limit(1);

    if (!row) {
      throw new Error("App settings singleton row could not be created.");
    }

    return mapAppSettingsRow(row);
  }

  return {
    getOrCreateSettings,

    async updateSettings(input: AppSettings): Promise<AppSettings> {
      await getOrCreateSettings();

      const [row] = await getDbOrThrow()
        .update(appSettingsTable)
        .set({
          defaultProvider: input.defaultProvider,
          missingDataBehavior: input.missingDataBehavior,
          showSampleData: input.showSampleData,
          updatedAt: new Date(),
        })
        .where(eq(appSettingsTable.id, appSettingsId))
        .returning();

      if (!row) {
        throw new Error("App settings singleton row could not be updated.");
      }

      return mapAppSettingsRow(row);
    },
  };
}
