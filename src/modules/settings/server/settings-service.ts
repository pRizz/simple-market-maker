import "server-only";

import {
  maybeParseAppSettingsInput,
  type AppSettings,
  type RawAppSettingsInput,
} from "@/modules/settings/domain/app-settings";
import {
  createAppSettingsRepository,
  type AppSettingsRepository,
} from "@/modules/settings/server/app-settings-repository";

export type SettingsServiceDependencies = {
  settingsRepository?: AppSettingsRepository;
};

export type SettingsServiceResult =
  | {
      ok: true;
      value: AppSettings;
    }
  | {
      ok: false;
      fieldErrors: Partial<
        Record<"defaultProvider" | "missingDataBehavior" | "showSampleData", string>
      >;
      formErrors: string[];
    };

function settingsFailureResult(message: string): SettingsServiceResult {
  return {
    ok: false,
    fieldErrors: {},
    formErrors: [message],
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;

export function createSettingsService(
  dependencies: SettingsServiceDependencies = {},
) {
  const settingsRepository =
    dependencies.settingsRepository ?? createAppSettingsRepository();

  return {
    async getSettings(): Promise<SettingsServiceResult> {
      try {
        return {
          ok: true,
          value: await settingsRepository.getOrCreateSettings(),
        };
      } catch {
        return settingsFailureResult("Unable to load app settings.");
      }
    },

    async updateSettings(rawInput: unknown): Promise<SettingsServiceResult> {
      const parsedInput = maybeParseAppSettingsInput(
        rawInput as RawAppSettingsInput,
      );

      if (!parsedInput.ok) {
        return {
          ok: false,
          fieldErrors: parsedInput.fieldErrors,
          formErrors: parsedInput.formErrors,
        };
      }

      try {
        return {
          ok: true,
          value: await settingsRepository.updateSettings(parsedInput.value),
        };
      } catch {
        return settingsFailureResult("Unable to update app settings.");
      }
    },
  };
}
