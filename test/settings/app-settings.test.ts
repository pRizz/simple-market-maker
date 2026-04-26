import { describe, expect, it } from "vitest";

import {
  defaultAppSettings,
  maybeParseAppSettingsInput,
  type RawAppSettingsInput,
} from "@/modules/settings/domain/app-settings";

describe("app settings domain", () => {
  it("uses real-data-first defaults", () => {
    // Arrange / Act / Assert
    expect(defaultAppSettings).toEqual({
      defaultProvider: "alpha_vantage",
      missingDataBehavior: "confirm_before_fetch",
      showSampleData: false,
    });
  });

  it("accepts alpha vantage as the default provider", () => {
    // Arrange
    const rawInput: RawAppSettingsInput = {
      defaultProvider: "alpha_vantage",
      missingDataBehavior: "confirm_before_fetch",
      showSampleData: false,
    };

    // Act
    const result = maybeParseAppSettingsInput(rawInput);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected settings validation success.");
    }
    expect(result.value.defaultProvider).toBe("alpha_vantage");
  });

  it("rejects sample data as the default provider", () => {
    // Arrange
    const rawInput = {
      defaultProvider: "sample",
      missingDataBehavior: "confirm_before_fetch",
      showSampleData: false,
    } as unknown as RawAppSettingsInput;

    // Act
    const result = maybeParseAppSettingsInput(rawInput);

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected settings validation failure.");
    }
    expect(result.fieldErrors.defaultProvider).toBeDefined();
  });

  it("rejects twelve data as the default provider", () => {
    // Arrange
    const rawInput = {
      defaultProvider: "twelve_data",
      missingDataBehavior: "confirm_before_fetch",
      showSampleData: false,
    } as unknown as RawAppSettingsInput;

    // Act
    const result = maybeParseAppSettingsInput(rawInput);

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected settings validation failure.");
    }
    expect(result.fieldErrors.defaultProvider).toBeDefined();
  });

  it("accepts both missing-data behaviors and sample visibility", () => {
    // Arrange
    const rawInputs: RawAppSettingsInput[] = [
      {
        defaultProvider: "alpha_vantage",
        missingDataBehavior: "confirm_before_fetch",
        showSampleData: false,
      },
      {
        defaultProvider: "alpha_vantage",
        missingDataBehavior: "silent_fetch",
        showSampleData: true,
      },
    ];

    // Act
    const results = rawInputs.map((rawInput) =>
      maybeParseAppSettingsInput(rawInput),
    );

    // Assert
    expect(results.every((result) => result.ok)).toBe(true);
    const silentFetchResult = results[1];
    if (!silentFetchResult.ok) {
      throw new Error("Expected settings validation success.");
    }
    expect(silentFetchResult.value.missingDataBehavior).toBe("silent_fetch");
    expect(silentFetchResult.value.showSampleData).toBe(true);
  });
});
