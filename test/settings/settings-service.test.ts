import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { defaultAppSettings } from "@/modules/settings/domain/app-settings";
import { createSettingsService } from "@/modules/settings/server/settings-service";

describe("settings service", () => {
  it("returns singleton defaults from the settings repository", async () => {
    // Arrange
    const service = createSettingsService({
      settingsRepository: {
        getOrCreateSettings: async () => defaultAppSettings,
        updateSettings: async (input) => input,
      },
    });

    // Act
    const result = await service.getSettings();

    // Assert
    expect(result).toEqual({
      ok: true,
      value: defaultAppSettings,
    });
  });

  it("accepts alpha vantage, silent fetch, and explicit sample visibility", async () => {
    // Arrange
    const service = createSettingsService({
      settingsRepository: {
        getOrCreateSettings: async () => defaultAppSettings,
        updateSettings: async (input) => input,
      },
    });

    // Act
    const result = await service.updateSettings({
      defaultProvider: "alpha_vantage",
      missingDataBehavior: "silent_fetch",
      showSampleData: true,
    });

    // Assert
    expect(result).toEqual({
      ok: true,
      value: {
        defaultProvider: "alpha_vantage",
        missingDataBehavior: "silent_fetch",
        showSampleData: true,
      },
    });
  });

  it("rejects sample as a default provider while accepting the explicit sample gate", async () => {
    // Arrange
    const service = createSettingsService({
      settingsRepository: {
        getOrCreateSettings: async () => defaultAppSettings,
        updateSettings: async (input) => input,
      },
    });

    // Act
    const result = await service.updateSettings({
      defaultProvider: "sample",
      missingDataBehavior: "confirm_before_fetch",
      showSampleData: true,
    });

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected settings validation failure.");
    }
    expect(result.fieldErrors.defaultProvider).toBeDefined();
    expect(result.fieldErrors.showSampleData).toBeUndefined();
  });

  it("rejects twelve data as a default provider", async () => {
    // Arrange
    const service = createSettingsService({
      settingsRepository: {
        getOrCreateSettings: async () => defaultAppSettings,
        updateSettings: async (input) => input,
      },
    });

    // Act
    const result = await service.updateSettings({
      defaultProvider: "twelve_data",
      missingDataBehavior: "confirm_before_fetch",
      showSampleData: false,
    });

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected settings validation failure.");
    }
    expect(result.fieldErrors.defaultProvider).toBeDefined();
  });
});
