import { describe, expect, it } from "vitest";

import {
  isKeyManageableProviderId,
  keyManageableProviderIds,
  providerDescriptors,
} from "@/modules/settings/domain/provider-registry";

describe("provider registry", () => {
  it("describes alpha vantage as the implemented key-managed default provider", () => {
    // Arrange / Act
    const descriptor = providerDescriptors.alpha_vantage;

    // Assert
    expect(descriptor.id).toBe("alpha_vantage");
    expect(descriptor.implementationStatus).toBe("implemented");
    expect(descriptor.keyRequirement).toBe("required");
    expect(descriptor.isSelectableDefault).toBe(true);
    expect(descriptor.isKeyManageable).toBe(true);
    expect(descriptor.maybeEnvironmentFallbackName).toBe(
      "ALPHA_VANTAGE_API_KEY",
    );
    expect(descriptor.supportedIntervals).toEqual(["daily"]);
  });

  it("describes sample as gated demo data without key management", () => {
    // Arrange / Act
    const descriptor = providerDescriptors.sample;

    // Assert
    expect(descriptor.id).toBe("sample");
    expect(descriptor.implementationStatus).toBe("demo");
    expect(descriptor.keyRequirement).toBe("none");
    expect(descriptor.isSelectableDefault).toBe(false);
    expect(descriptor.isKeyManageable).toBe(false);
    expect(descriptor.supportedIntervals).toEqual(["daily"]);
    expect(descriptor.safeDescription).toMatch(/gated demo\/development data/);
  });

  it("describes twelve data as planned without adapter behavior", () => {
    // Arrange / Act
    const descriptor = providerDescriptors.twelve_data;

    // Assert
    expect(descriptor.id).toBe("twelve_data");
    expect(descriptor.implementationStatus).toBe("planned");
    expect(descriptor.keyRequirement).toBe("planned");
    expect(descriptor.isSelectableDefault).toBe(false);
    expect(descriptor.isKeyManageable).toBe(false);
    expect(descriptor.maybeEnvironmentFallbackName).toBeNull();
  });

  it("limits key management to alpha vantage in phase 1", () => {
    // Arrange / Act / Assert
    expect(keyManageableProviderIds).toEqual(["alpha_vantage"]);
    expect(isKeyManageableProviderId("alpha_vantage")).toBe(true);
    expect(isKeyManageableProviderId("sample")).toBe(false);
    expect(isKeyManageableProviderId("twelve_data")).toBe(false);
  });
});
