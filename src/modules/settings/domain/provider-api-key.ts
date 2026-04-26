import type { ProviderId } from "@/modules/settings/domain/app-settings";

export const providerKeyValidationStatuses = [
  "not_validated",
  "valid",
  "invalid",
] as const;

export type ProviderKeyValidationStatus =
  (typeof providerKeyValidationStatuses)[number];

export type ProviderApiKeyMetadata = {
  providerId: ProviderId;
  providerLabel: string;
  enabled: boolean;
  maskedSuffix: string;
  validationStatus: ProviderKeyValidationStatus;
  validationMessage: string | null;
  lastValidatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RawProviderApiKeyInput = {
  providerId: ProviderId;
  apiKey: string;
  enabled: boolean;
};

export function maskedSuffixFromApiKey(apiKey: string): string {
  const trimmedApiKey = apiKey.trim();

  if (trimmedApiKey.length <= 4) {
    return "****";
  }

  return trimmedApiKey.slice(-4);
}
