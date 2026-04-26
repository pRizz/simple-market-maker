import "server-only";

import {
  createProviderApiKeyService,
  type ProviderApiKeyService,
} from "@/modules/settings/server/provider-api-key-service";
import {
  createProviderCredentialResolver,
  type ProviderCredentialResolver,
} from "@/modules/settings/server/provider-credential-resolver";
import {
  createProviderKeyValidationService,
  type ProviderKeyValidationService,
} from "@/modules/settings/server/provider-key-validation-service";
import {
  createSettingsService,
  type SettingsService,
} from "@/modules/settings/server/settings-service";

let maybeSettingsService: SettingsService | null = null;
let maybeProviderApiKeyService: ProviderApiKeyService | null = null;
let maybeProviderCredentialResolver: ProviderCredentialResolver | null = null;
let maybeProviderKeyValidationService: ProviderKeyValidationService | null =
  null;

export function getSettingsService(): SettingsService {
  if (maybeSettingsService) {
    return maybeSettingsService;
  }

  maybeSettingsService = createSettingsService();

  return maybeSettingsService;
}

export function getProviderApiKeyService(): ProviderApiKeyService {
  if (maybeProviderApiKeyService) {
    return maybeProviderApiKeyService;
  }

  maybeProviderApiKeyService = createProviderApiKeyService();

  return maybeProviderApiKeyService;
}

export function getProviderCredentialResolver(): ProviderCredentialResolver {
  if (maybeProviderCredentialResolver) {
    return maybeProviderCredentialResolver;
  }

  maybeProviderCredentialResolver = createProviderCredentialResolver();

  return maybeProviderCredentialResolver;
}

export function getProviderKeyValidationService(): ProviderKeyValidationService {
  if (maybeProviderKeyValidationService) {
    return maybeProviderKeyValidationService;
  }

  maybeProviderKeyValidationService = createProviderKeyValidationService();

  return maybeProviderKeyValidationService;
}
