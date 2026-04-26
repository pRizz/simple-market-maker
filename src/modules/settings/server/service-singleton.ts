import "server-only";

import {
  createProviderApiKeyService,
  type ProviderApiKeyService,
} from "@/modules/settings/server/provider-api-key-service";
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

export function getProviderKeyValidationService(): ProviderKeyValidationService {
  if (maybeProviderKeyValidationService) {
    return maybeProviderKeyValidationService;
  }

  maybeProviderKeyValidationService = createProviderKeyValidationService();

  return maybeProviderKeyValidationService;
}
