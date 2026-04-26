import "server-only";

import {
  createProviderApiKeyRepository,
  type ProviderApiKeyRepository,
} from "@/modules/settings/server/provider-api-key-repository";
import {
  providerDescriptors,
  type KeyManageableProviderId,
} from "@/modules/settings/domain/provider-registry";
import {
  decryptProviderApiKey,
  type EncryptedProviderApiKey,
  type ProviderKeyDecryptionResult,
} from "@/modules/settings/server/provider-key-encryption";

export type ProviderCredentialResolution =
  | {
      kind: "persisted";
      providerId: "alpha_vantage";
      apiKey: string;
    }
  | {
      kind: "environment";
      providerId: "alpha_vantage";
      apiKey: string;
      environmentName: "ALPHA_VANTAGE_API_KEY";
    }
  | {
      kind: "missing";
      providerId: "alpha_vantage";
      message: string;
    };

export type ProviderCredentialResolverDependencies = {
  decryptProviderKey?: (
    record: EncryptedProviderApiKey,
  ) => ProviderKeyDecryptionResult;
  environment?: Record<string, string | undefined>;
  providerKeyRepository?: ProviderApiKeyRepository;
};

function missingAlphaVantageCredential(): ProviderCredentialResolution {
  return {
    kind: "missing",
    providerId: "alpha_vantage",
    message: "Alpha Vantage provider key is not configured.",
  };
}

function maybeEnvironmentCredential(
  environment: Record<string, string | undefined>,
): ProviderCredentialResolution | null {
  const maybeEnvironmentName =
    providerDescriptors.alpha_vantage.maybeEnvironmentFallbackName;

  if (maybeEnvironmentName !== "ALPHA_VANTAGE_API_KEY") {
    return null;
  }

  const maybeApiKey = environment[maybeEnvironmentName]?.trim();

  if (!maybeApiKey) {
    return null;
  }

  return {
    kind: "environment",
    providerId: "alpha_vantage",
    apiKey: maybeApiKey,
    environmentName: maybeEnvironmentName,
  };
}

export type ProviderCredentialResolver = ReturnType<
  typeof createProviderCredentialResolver
>;

export function createProviderCredentialResolver(
  dependencies: ProviderCredentialResolverDependencies = {},
) {
  const providerKeyRepository =
    dependencies.providerKeyRepository ?? createProviderApiKeyRepository();
  const decryptProviderKey =
    dependencies.decryptProviderKey ?? decryptProviderApiKey;
  const environment = dependencies.environment ?? process.env;

  return {
    async resolveProviderCredential(
      providerId: KeyManageableProviderId,
    ): Promise<ProviderCredentialResolution> {
      const maybeRecord =
        await providerKeyRepository.maybeGetProviderKeyByProvider(providerId);

      if (maybeRecord?.enabled) {
        const decryptionResult = decryptProviderKey(maybeRecord);

        if (!decryptionResult.ok) {
          return missingAlphaVantageCredential();
        }

        return {
          kind: "persisted",
          providerId,
          apiKey: decryptionResult.value,
        };
      }

      return (
        maybeEnvironmentCredential(environment) ?? missingAlphaVantageCredential()
      );
    },
  };
}
