import { describe, expect, it, vi } from "vitest";

import type { ProviderId } from "@/modules/settings/domain/app-settings";
import type {
  ProviderApiKeyRecord,
  ProviderApiKeyRepository,
} from "@/modules/settings/server/provider-api-key-repository";
import { createProviderCredentialResolver } from "@/modules/settings/server/provider-credential-resolver";
import type {
  EncryptedProviderApiKey,
  ProviderKeyDecryptionResult,
} from "@/modules/settings/server/provider-key-encryption";

vi.mock("server-only", () => ({}));

const fixedDate = new Date("2026-04-26T12:00:00.000Z");
const encryptedKey: EncryptedProviderApiKey = {
  encryptedKey: "encrypted-alpha",
  encryptionIv: "iv-alpha",
  encryptionAuthTag: "tag-alpha",
};

type FakeProviderKeyRepository = ProviderApiKeyRepository & {
  getCalls: ProviderId[];
  records: ProviderApiKeyRecord[];
};

function providerKeyRecord(
  overrides: Partial<ProviderApiKeyRecord> = {},
): ProviderApiKeyRecord {
  return {
    id: "key-alpha-vantage",
    providerId: "alpha_vantage",
    ...encryptedKey,
    maskedSuffix: "****1234",
    enabled: true,
    validationStatus: "valid",
    validationMessage: "provider_key_validated",
    lastValidatedAt: fixedDate,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...overrides,
  };
}

function createFakeRepository(
  initialRecords: ProviderApiKeyRecord[] = [],
): FakeProviderKeyRepository {
  return {
    getCalls: [],
    records: [...initialRecords],

    async deleteProviderKey() {
      return false;
    },

    async listProviderKeys() {
      return this.records;
    },

    async maybeGetProviderKeyByProvider(providerId) {
      this.getCalls.push(providerId);

      return (
        this.records.find((record) => record.providerId === providerId) ?? null
      );
    },

    async setProviderKeyEnabled() {
      return null;
    },

    async updateProviderKeyValidation() {
      return null;
    },

    async upsertProviderKey() {
      throw new Error("Resolver tests should not upsert provider keys.");
    },
  };
}

function serialize(value: unknown): string {
  return JSON.stringify(value);
}

describe("provider credential resolver", () => {
  it("returns kind: \"persisted\" for an enabled saved alpha vantage key before environment fallback", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const decryptProviderKey = vi.fn(
      (): ProviderKeyDecryptionResult => ({
        ok: true,
        value: "persisted-alpha-key",
      }),
    );
    const resolver = createProviderCredentialResolver({
      decryptProviderKey,
      environment: {
        ALPHA_VANTAGE_API_KEY: "environment-alpha-key",
      },
      providerKeyRepository: repository,
    });

    // Act
    const result = await resolver.resolveProviderCredential("alpha_vantage");

    // Assert
    expect(result).toEqual({
      kind: "persisted",
      providerId: "alpha_vantage",
      apiKey: "persisted-alpha-key",
    });
    expect(decryptProviderKey).toHaveBeenCalledTimes(1);
    expect(repository.getCalls).toEqual(["alpha_vantage"]);
  });

  it("does not decrypt or return disabled saved keys", async () => {
    // Arrange
    const repository = createFakeRepository([
      providerKeyRecord({
        enabled: false,
      }),
    ]);
    const decryptProviderKey = vi.fn(
      (): ProviderKeyDecryptionResult => ({
        ok: true,
        value: "disabled-saved-key",
      }),
    );
    const resolver = createProviderCredentialResolver({
      decryptProviderKey,
      environment: {
        ALPHA_VANTAGE_API_KEY: "environment-alpha-key",
      },
      providerKeyRepository: repository,
    });

    // Act
    const result = await resolver.resolveProviderCredential("alpha_vantage");

    // Assert
    expect(result).toEqual({
      kind: "environment",
      providerId: "alpha_vantage",
      apiKey: "environment-alpha-key",
      environmentName: "ALPHA_VANTAGE_API_KEY",
    });
    expect(decryptProviderKey).not.toHaveBeenCalled();
  });

  it("returns kind: \"environment\" only when no enabled saved key resolves", async () => {
    // Arrange
    const repository = createFakeRepository();
    const resolver = createProviderCredentialResolver({
      environment: {
        ALPHA_VANTAGE_API_KEY: "environment-alpha-key",
      },
      providerKeyRepository: repository,
    });

    // Act
    const result = await resolver.resolveProviderCredential("alpha_vantage");

    // Assert
    expect(result).toEqual({
      kind: "environment",
      providerId: "alpha_vantage",
      apiKey: "environment-alpha-key",
      environmentName: "ALPHA_VANTAGE_API_KEY",
    });
  });

  it("returns kind: \"missing\" with a safe message when no saved or environment key exists", async () => {
    // Arrange
    const repository = createFakeRepository();
    const resolver = createProviderCredentialResolver({
      environment: {},
      providerKeyRepository: repository,
    });

    // Act
    const result = await resolver.resolveProviderCredential("alpha_vantage");

    // Assert
    expect(result).toEqual({
      kind: "missing",
      providerId: "alpha_vantage",
      message: "Alpha Vantage provider key is not configured.",
    });
    expect(serialize(result)).not.toContain("encrypted-alpha");
    expect(serialize(result)).not.toContain("iv-alpha");
    expect(serialize(result)).not.toContain("tag-alpha");
  });

  it("fails closed when an enabled saved key cannot be decrypted", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const decryptProviderKey = vi.fn(
      (): ProviderKeyDecryptionResult => ({
        ok: false,
        code: "missing_encryption_secret",
      }),
    );
    const resolver = createProviderCredentialResolver({
      decryptProviderKey,
      environment: {
        ALPHA_VANTAGE_API_KEY: "environment-alpha-key",
      },
      providerKeyRepository: repository,
    });

    // Act
    const result = await resolver.resolveProviderCredential("alpha_vantage");

    // Assert
    expect(result).toEqual({
      kind: "missing",
      providerId: "alpha_vantage",
      message: "Alpha Vantage provider key is not configured.",
    });
    expect(decryptProviderKey).toHaveBeenCalledTimes(1);
    expect(serialize(result)).not.toContain("environment-alpha-key");
    expect(serialize(result)).not.toContain("encrypted-alpha");
    expect(serialize(result)).not.toContain("iv-alpha");
    expect(serialize(result)).not.toContain("tag-alpha");
  });
});
