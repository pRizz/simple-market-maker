import "server-only";

import type { ProviderId } from "@/modules/settings/domain/app-settings";
import type { ProviderApiKeyMetadata } from "@/modules/settings/domain/provider-api-key";
import {
  isKeyManageableProviderId,
  providerDescriptors,
} from "@/modules/settings/domain/provider-registry";
import {
  createProviderApiKeyRepository,
  type ProviderApiKeyRecord,
  type ProviderApiKeyRepository,
  type ProviderApiKeyValidationUpdate,
} from "@/modules/settings/server/provider-api-key-repository";
import {
  sanitizeProviderError,
  type ProviderValidationMessageCode,
} from "@/modules/settings/server/provider-error-sanitizer";
import {
  decryptProviderApiKey,
  type EncryptedProviderApiKey,
  type ProviderKeyDecryptionResult,
} from "@/modules/settings/server/provider-key-encryption";

const alphaVantageDailySeriesKey = "Time Series (Daily)";

type ProviderValidationResponse = {
  json: () => Promise<unknown>;
  ok: boolean;
  status: number;
  statusText: string;
};

type ProviderValidationFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<ProviderValidationResponse>;

export type ProviderKeyValidationResult =
  | {
      ok: true;
      value: ProviderApiKeyMetadata;
    }
  | {
      ok: false;
      code: "unsupported_provider" | ProviderValidationMessageCode;
      message: string;
    };

export type ProviderKeyValidationServiceDependencies = {
  decryptProviderKey?: (
    record: EncryptedProviderApiKey,
  ) => ProviderKeyDecryptionResult;
  fetchFn?: ProviderValidationFetch;
  now?: () => Date;
  providerKeyRepository?: ProviderApiKeyRepository;
};

function metadataFromRecord(
  record: ProviderApiKeyRecord,
): ProviderApiKeyMetadata {
  return {
    providerId: record.providerId,
    providerLabel: providerDescriptors[record.providerId].label,
    enabled: record.enabled,
    maskedSuffix: record.maskedSuffix,
    validationStatus: record.validationStatus,
    validationMessage: record.validationMessage,
    lastValidatedAt: record.lastValidatedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function validationUpdate(
  code: ProviderValidationMessageCode,
  validatedAt: Date,
): ProviderApiKeyValidationUpdate {
  return {
    validationStatus: code === "provider_key_validated" ? "valid" : "invalid",
    validationMessage: code,
    lastValidatedAt: validatedAt,
  };
}

function unsupportedProviderResult(
  providerId: ProviderId,
): ProviderKeyValidationResult {
  return {
    ok: false,
    code: "unsupported_provider",
    message: `Provider key validation is not supported for ${providerDescriptors[providerId].label}.`,
  };
}

function missingProviderKeyResult(): ProviderKeyValidationResult {
  return {
    ok: false,
    code: "missing_provider_key",
    message: "A usable saved provider key is not configured.",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function maybeProviderMessage(responseBody: Record<string, unknown>): string | null {
  const maybeErrorMessage = responseBody["Error Message"];
  if (typeof maybeErrorMessage === "string" && maybeErrorMessage.trim()) {
    return maybeErrorMessage;
  }

  const maybeNote = responseBody.Note;
  if (typeof maybeNote === "string" && maybeNote.trim()) {
    return maybeNote;
  }

  const maybeInformation = responseBody.Information;
  if (typeof maybeInformation === "string" && maybeInformation.trim()) {
    return maybeInformation;
  }

  return null;
}

function validationCodeFromResponseBody(
  responseBody: unknown,
): ProviderValidationMessageCode {
  if (!isRecord(responseBody)) {
    return "malformed_provider_response";
  }

  const maybeMessage = maybeProviderMessage(responseBody);
  if (maybeMessage) {
    return sanitizeProviderError(maybeMessage).code;
  }

  const maybeDailySeries = responseBody[alphaVantageDailySeriesKey];
  if (!isRecord(maybeDailySeries)) {
    return "malformed_provider_response";
  }

  if (Object.keys(maybeDailySeries).length === 0) {
    return "malformed_provider_response";
  }

  return "provider_key_validated";
}

function alphaVantageValidationUrl(apiKey: string): URL {
  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "TIME_SERIES_DAILY");
  url.searchParams.set("symbol", "IBM");
  url.searchParams.set("outputsize", "compact");
  url.searchParams.set("apikey", apiKey);

  return url;
}

export type ProviderKeyValidationService = ReturnType<
  typeof createProviderKeyValidationService
>;

export function createProviderKeyValidationService(
  dependencies: ProviderKeyValidationServiceDependencies = {},
) {
  const providerKeyRepository =
    dependencies.providerKeyRepository ?? createProviderApiKeyRepository();
  const decryptProviderKey =
    dependencies.decryptProviderKey ?? decryptProviderApiKey;
  const fetchFn = dependencies.fetchFn ?? fetch;
  const now = dependencies.now ?? (() => new Date());

  async function updateValidation(
    providerId: ProviderId,
    code: ProviderValidationMessageCode,
  ): Promise<ProviderKeyValidationResult> {
    const maybeRecord = await providerKeyRepository.updateProviderKeyValidation(
      providerId,
      validationUpdate(code, now()),
    );

    if (!maybeRecord) {
      return missingProviderKeyResult();
    }

    return {
      ok: true,
      value: metadataFromRecord(maybeRecord),
    };
  }

  return {
    async validateProviderKey(
      providerId: ProviderId,
    ): Promise<ProviderKeyValidationResult> {
      if (!isKeyManageableProviderId(providerId)) {
        return unsupportedProviderResult(providerId);
      }

      const maybeRecord =
        await providerKeyRepository.maybeGetProviderKeyByProvider(providerId);

      if (!maybeRecord?.enabled) {
        return missingProviderKeyResult();
      }

      const decryptionResult = decryptProviderKey(maybeRecord);
      if (!decryptionResult.ok) {
        return updateValidation(providerId, "missing_provider_key");
      }

      try {
        const response = await fetchFn(
          alphaVantageValidationUrl(decryptionResult.value),
        );

        if (!response.ok) {
          return updateValidation(providerId, "provider_unavailable");
        }

        const responseBody = await response.json();
        const code = validationCodeFromResponseBody(responseBody);

        return updateValidation(providerId, code);
      } catch (error) {
        return updateValidation(
          providerId,
          sanitizeProviderError(error, [decryptionResult.value]).code,
        );
      }
    },
  };
}
