import type { MarketDataInterval } from "@/modules/market-data/domain/market-data-chunk";
import type { ProviderId } from "@/modules/settings/domain/app-settings";

export type ProviderImplementationStatus = "implemented" | "demo" | "planned";
export type ProviderKeyRequirement = "required" | "none" | "planned";

export type ProviderDescriptor = {
  id: ProviderId;
  label: string;
  implementationStatus: ProviderImplementationStatus;
  keyRequirement: ProviderKeyRequirement;
  maybeEnvironmentFallbackName: string | null;
  supportedIntervals: readonly MarketDataInterval[];
  safeDescription: string;
  isSelectableDefault: boolean;
  isKeyManageable: boolean;
};

export const providerDescriptors = {
  alpha_vantage: {
    id: "alpha_vantage",
    label: "Alpha Vantage",
    implementationStatus: "implemented",
    keyRequirement: "required",
    maybeEnvironmentFallbackName: "ALPHA_VANTAGE_API_KEY",
    supportedIntervals: ["daily"],
    safeDescription:
      "Implemented real daily market-data provider with saved-key support and an environment fallback during migration.",
    isSelectableDefault: true,
    isKeyManageable: true,
  },
  sample: {
    id: "sample",
    label: "Sample Data",
    implementationStatus: "demo",
    keyRequirement: "none",
    maybeEnvironmentFallbackName: null,
    supportedIntervals: ["daily"],
    safeDescription:
      "gated demo/development data for local demos and tests, not the normal real-data default.",
    isSelectableDefault: false,
    isKeyManageable: false,
  },
  twelve_data: {
    id: "twelve_data",
    label: "Twelve Data",
    implementationStatus: "planned",
    keyRequirement: "planned",
    maybeEnvironmentFallbackName: null,
    supportedIntervals: ["daily"],
    safeDescription:
      "Planned second provider candidate; adapter behavior is deferred until the Phase 4 validation spike.",
    isSelectableDefault: false,
    isKeyManageable: false,
  },
} as const satisfies Record<ProviderId, ProviderDescriptor>;

export const keyManageableProviderIds = ["alpha_vantage"] as const;

export type KeyManageableProviderId =
  (typeof keyManageableProviderIds)[number];

export function isKeyManageableProviderId(
  value: ProviderId,
): value is KeyManageableProviderId {
  return keyManageableProviderIds.includes(value as KeyManageableProviderId);
}
