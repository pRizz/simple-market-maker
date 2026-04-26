import "server-only";

import {
  providerIds,
  type ProviderId,
} from "@/modules/settings/domain/app-settings";
import {
  maskedSuffixFromApiKey,
  type ProviderApiKeyMetadata,
} from "@/modules/settings/domain/provider-api-key";
import {
  isKeyManageableProviderId,
  providerDescriptors,
} from "@/modules/settings/domain/provider-registry";
import {
  createProviderApiKeyRepository,
  type ProviderApiKeyRecord,
  type ProviderApiKeyRepository,
} from "@/modules/settings/server/provider-api-key-repository";
import {
  encryptProviderApiKey,
  type ProviderKeyEncryptionResult,
} from "@/modules/settings/server/provider-key-encryption";

export type ProviderApiKeyServiceDependencies = {
  encryptProviderKey?: (apiKey: string) => ProviderKeyEncryptionResult;
  providerKeyRepository?: ProviderApiKeyRepository;
};

export type ProviderApiKeyMutationResult =
  | {
      ok: true;
      value: ProviderApiKeyMetadata;
    }
  | {
      ok: false;
      fieldErrors: Partial<Record<"providerId" | "apiKey" | "enabled", string>>;
      message: string;
    };

export type ProviderApiKeyDeleteResult =
  | {
      ok: true;
      deleted: boolean;
    }
  | {
      ok: false;
      fieldErrors: Partial<Record<"providerId", string>>;
      message: string;
    };

type ParsedProviderKeyInput =
  | {
      ok: true;
      value: {
        apiKey: string;
        enabled: boolean;
        providerId: ProviderId;
      };
    }
  | {
      ok: false;
      fieldErrors: Partial<Record<"providerId" | "apiKey" | "enabled", string>>;
      message: string;
    };

function maybeProviderId(value: unknown): ProviderId | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!providerIds.includes(value as ProviderId)) {
    return null;
  }

  return value as ProviderId;
}

function providerKeyFailureResult(
  message: string,
  fieldErrors: Partial<Record<"providerId" | "apiKey" | "enabled", string>> = {},
): ProviderApiKeyMutationResult {
  return {
    ok: false,
    fieldErrors,
    message,
  };
}

function providerKeyDeleteFailureResult(
  message: string,
): ProviderApiKeyDeleteResult {
  return {
    ok: false,
    fieldErrors: {
      providerId: message,
    },
    message,
  };
}

function unsupportedProviderMessage(providerId: ProviderId): string {
  return `Saved keys are not supported for ${providerDescriptors[providerId].label}.`;
}

function encryptionFailureMessage(
  result: Exclude<ProviderKeyEncryptionResult, { ok: true }>,
): string {
  if (result.code === "missing_encryption_secret") {
    return "Provider key encryption is not configured.";
  }

  if (result.code === "invalid_encryption_secret") {
    return "Provider key encryption is misconfigured.";
  }

  return "Provider key encryption failed.";
}

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

function parseProviderKeyInput(rawInput: unknown): ParsedProviderKeyInput {
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    return {
      ok: false,
      fieldErrors: {},
      message: "Provider key input is invalid.",
    };
  }

  const input = rawInput as Record<string, unknown>;
  const maybeInputProviderId = maybeProviderId(input.providerId);

  if (!maybeInputProviderId) {
    return {
      ok: false,
      fieldErrors: {
        providerId: "Select a supported provider.",
      },
      message: "Provider key provider is invalid.",
    };
  }

  if (!isKeyManageableProviderId(maybeInputProviderId)) {
    const message = unsupportedProviderMessage(maybeInputProviderId);

    return {
      ok: false,
      fieldErrors: {
        providerId: message,
      },
      message,
    };
  }

  if (typeof input.apiKey !== "string" || !input.apiKey.trim()) {
    return {
      ok: false,
      fieldErrors: {
        apiKey: "Enter a provider API key.",
      },
      message: "Provider API key is required.",
    };
  }

  if (typeof input.enabled !== "boolean") {
    return {
      ok: false,
      fieldErrors: {
        enabled: "Choose whether this key is enabled.",
      },
      message: "Provider key enabled state is invalid.",
    };
  }

  return {
    ok: true,
    value: {
      apiKey: input.apiKey.trim(),
      enabled: input.enabled,
      providerId: maybeInputProviderId,
    },
  };
}

export type ProviderApiKeyService = ReturnType<
  typeof createProviderApiKeyService
>;

export function createProviderApiKeyService(
  dependencies: ProviderApiKeyServiceDependencies = {},
) {
  const providerKeyRepository =
    dependencies.providerKeyRepository ?? createProviderApiKeyRepository();
  const encryptProviderKey =
    dependencies.encryptProviderKey ?? encryptProviderApiKey;

  return {
    async deleteProviderKey(
      providerId: ProviderId,
    ): Promise<ProviderApiKeyDeleteResult> {
      if (!isKeyManageableProviderId(providerId)) {
        return providerKeyDeleteFailureResult(
          unsupportedProviderMessage(providerId),
        );
      }

      return {
        ok: true,
        deleted: await providerKeyRepository.deleteProviderKey(providerId),
      };
    },

    async listProviderKeys(): Promise<ProviderApiKeyMetadata[]> {
      const records = await providerKeyRepository.listProviderKeys();

      return records.map(metadataFromRecord);
    },

    async saveProviderKey(
      rawInput: unknown,
    ): Promise<ProviderApiKeyMutationResult> {
      const parsedInput = parseProviderKeyInput(rawInput);

      if (!parsedInput.ok) {
        return providerKeyFailureResult(
          parsedInput.message,
          parsedInput.fieldErrors,
        );
      }

      const encryptionResult = encryptProviderKey(parsedInput.value.apiKey);

      if (!encryptionResult.ok) {
        return providerKeyFailureResult(
          encryptionFailureMessage(encryptionResult),
        );
      }

      const record = await providerKeyRepository.upsertProviderKey({
        ...encryptionResult.value,
        providerId: parsedInput.value.providerId,
        maskedSuffix: `****${maskedSuffixFromApiKey(parsedInput.value.apiKey)}`,
        enabled: parsedInput.value.enabled,
      });

      return {
        ok: true,
        value: metadataFromRecord(record),
      };
    },

    async setProviderKeyEnabled(
      providerId: ProviderId,
      enabled: boolean,
    ): Promise<ProviderApiKeyMutationResult> {
      if (!isKeyManageableProviderId(providerId)) {
        const message = unsupportedProviderMessage(providerId);

        return providerKeyFailureResult(message, {
          providerId: message,
        });
      }

      const maybeRecord = await providerKeyRepository.setProviderKeyEnabled(
        providerId,
        enabled,
      );

      if (!maybeRecord) {
        return providerKeyFailureResult("Provider key was not found.");
      }

      return {
        ok: true,
        value: metadataFromRecord(maybeRecord),
      };
    },
  };
}
