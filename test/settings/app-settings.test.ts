import { describe, expect, it } from "vitest";

import {
  appSettingsTable,
  providerApiKeysTable,
} from "@/modules/db/schema";
import {
  defaultAppSettings,
  maybeParseAppSettingsInput,
  type RawAppSettingsInput,
} from "@/modules/settings/domain/app-settings";
import type { ProviderApiKeyMetadata } from "@/modules/settings/domain/provider-api-key";

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

  it("keeps schema defaults aligned with domain defaults", () => {
    // Arrange / Act / Assert
    expect(appSettingsTable.id.default).toBe("singleton");
    expect(appSettingsTable.defaultProvider.name).toBe("default_provider");
    expect(appSettingsTable.defaultProvider.default).toBe(
      defaultAppSettings.defaultProvider,
    );
    expect(appSettingsTable.missingDataBehavior.name).toBe(
      "missing_data_behavior",
    );
    expect(appSettingsTable.missingDataBehavior.default).toBe(
      defaultAppSettings.missingDataBehavior,
    );
    expect(appSettingsTable.showSampleData.name).toBe("show_sample_data");
    expect(appSettingsTable.showSampleData.default).toBe(
      defaultAppSettings.showSampleData,
    );
  });

  it("keeps provider key metadata separate from encrypted schema columns", () => {
    // Arrange
    const metadata: ProviderApiKeyMetadata = {
      providerId: "alpha_vantage",
      providerLabel: "Alpha Vantage",
      enabled: true,
      maskedSuffix: "ABCD",
      validationStatus: "not_validated",
      validationMessage: null,
      lastValidatedAt: null,
      createdAt: new Date("2026-04-26T00:00:00.000Z"),
      updatedAt: new Date("2026-04-26T00:00:00.000Z"),
    };

    // Act
    const metadataKeys = Object.keys(metadata);

    // Assert
    expect(providerApiKeysTable.providerId.name).toBe("provider_id");
    expect(providerApiKeysTable.providerId.isUnique).toBe(true);
    expect(providerApiKeysTable.encryptedKey.name).toBe("encrypted_key");
    expect(providerApiKeysTable.encryptionIv.name).toBe("encryption_iv");
    expect(providerApiKeysTable.encryptionAuthTag.name).toBe(
      "encryption_auth_tag",
    );
    expect(providerApiKeysTable.maskedSuffix.name).toBe("masked_suffix");
    expect(providerApiKeysTable.validationStatus.default).toBe("not_validated");
    expect(metadataKeys).not.toContain("apiKey");
    expect(metadataKeys).not.toContain("encryptedKey");
    expect(metadataKeys).not.toContain("encryptionIv");
    expect(metadataKeys).not.toContain("encryptionAuthTag");
  });
});
