import { describe, expect, it, vi } from "vitest";

import type { ProviderId } from "@/modules/settings/domain/app-settings";
import type { ProviderApiKeyMetadata } from "@/modules/settings/domain/provider-api-key";
import type {
  ProviderApiKeyRecord,
  ProviderApiKeyRepository,
  ProviderApiKeyUpsertInput,
  ProviderApiKeyValidationUpdate,
} from "@/modules/settings/server/provider-api-key-repository";
import { createProviderApiKeyService } from "@/modules/settings/server/provider-api-key-service";
import type { EncryptedProviderApiKey } from "@/modules/settings/server/provider-key-encryption";

vi.mock("server-only", () => ({}));

const fixedDate = new Date("2026-04-26T12:00:00.000Z");
const encryptedKeyA: EncryptedProviderApiKey = {
  encryptedKey: "encrypted-a",
  encryptionIv: "iv-a",
  encryptionAuthTag: "tag-a",
};
const encryptedKeyB: EncryptedProviderApiKey = {
  encryptedKey: "encrypted-b",
  encryptionIv: "iv-b",
  encryptionAuthTag: "tag-b",
};

type FakeProviderKeyRepository = ProviderApiKeyRepository & {
  deleteCalls: ProviderId[];
  records: ProviderApiKeyRecord[];
  setEnabledCalls: ProviderId[];
  upsertCalls: ProviderApiKeyUpsertInput[];
};

function providerKeyRecord(
  overrides: Partial<ProviderApiKeyRecord> = {},
): ProviderApiKeyRecord {
  return {
    id: "key-alpha-vantage",
    providerId: "alpha_vantage",
    encryptedKey: "encrypted-existing",
    encryptionIv: "iv-existing",
    encryptionAuthTag: "tag-existing",
    maskedSuffix: "****0000",
    enabled: true,
    validationStatus: "valid",
    validationMessage: "Validated",
    lastValidatedAt: fixedDate,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...overrides,
  };
}

function createFakeRepository(
  initialRecords: ProviderApiKeyRecord[] = [],
): FakeProviderKeyRepository {
  const repository: FakeProviderKeyRepository = {
    deleteCalls: [],
    records: [...initialRecords],
    setEnabledCalls: [],
    upsertCalls: [],

    async deleteProviderKey(providerId) {
      repository.deleteCalls.push(providerId);
      const originalLength = repository.records.length;
      repository.records = repository.records.filter(
        (record) => record.providerId !== providerId,
      );

      return repository.records.length !== originalLength;
    },

    async listProviderKeys() {
      return repository.records;
    },

    async maybeGetProviderKeyByProvider(providerId) {
      return (
        repository.records.find((record) => record.providerId === providerId) ??
        null
      );
    },

    async setProviderKeyEnabled(providerId, enabled) {
      repository.setEnabledCalls.push(providerId);
      const maybeRecord = repository.records.find(
        (record) => record.providerId === providerId,
      );

      if (!maybeRecord) {
        return null;
      }

      maybeRecord.enabled = enabled;
      maybeRecord.updatedAt = fixedDate;

      return maybeRecord;
    },

    async updateProviderKeyValidation(
      providerId,
      validation: ProviderApiKeyValidationUpdate,
    ) {
      const maybeRecord = repository.records.find(
        (record) => record.providerId === providerId,
      );

      if (!maybeRecord) {
        return null;
      }

      maybeRecord.validationStatus = validation.validationStatus;
      maybeRecord.validationMessage = validation.validationMessage;
      maybeRecord.lastValidatedAt = validation.lastValidatedAt;
      maybeRecord.updatedAt = fixedDate;

      return maybeRecord;
    },

    async upsertProviderKey(record) {
      repository.upsertCalls.push(record);
      const maybeExistingRecord = repository.records.find(
        (existingRecord) => existingRecord.providerId === record.providerId,
      );
      const nextRecord = providerKeyRecord({
        ...record,
        id: maybeExistingRecord?.id ?? `key-${record.providerId}`,
        validationStatus: "not_validated",
        validationMessage: null,
        lastValidatedAt: null,
        createdAt: maybeExistingRecord?.createdAt ?? fixedDate,
        updatedAt: fixedDate,
      });

      if (maybeExistingRecord) {
        Object.assign(maybeExistingRecord, nextRecord);
        return maybeExistingRecord;
      }

      repository.records.push(nextRecord);
      return nextRecord;
    },
  };

  return repository;
}

function metadataKeys(metadata: ProviderApiKeyMetadata): string[] {
  return Object.keys(metadata);
}

function expectSafeMetadata(metadata: ProviderApiKeyMetadata): void {
  expect(metadataKeys(metadata)).not.toContain("apiKey");
  expect(metadataKeys(metadata)).not.toContain("encryptedKey");
  expect(metadataKeys(metadata)).not.toContain("encryptionIv");
  expect(metadataKeys(metadata)).not.toContain("encryptionAuthTag");
}

describe("provider api key service", () => {
  it("encrypts and stores alpha vantage keys while returning safe metadata", async () => {
    // Arrange
    const repository = createFakeRepository();
    const encryptedInputs: string[] = [];
    const service = createProviderApiKeyService({
      encryptProviderKey: (apiKey) => {
        encryptedInputs.push(apiKey);
        return {
          ok: true,
          value: encryptedKeyA,
        };
      },
      providerKeyRepository: repository,
    });

    // Act
    const result = await service.saveProviderKey({
      providerId: "alpha_vantage",
      apiKey: "alpha-vantage-test-key-1234",
      enabled: true,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected provider key save success.");
    }
    expect(encryptedInputs).toEqual(["alpha-vantage-test-key-1234"]);
    expect(repository.records).toHaveLength(1);
    expect(repository.records[0].encryptedKey).toBe("encrypted-a");
    expect(repository.records[0].encryptedKey).not.toBe(
      "alpha-vantage-test-key-1234",
    );
    expect(repository.records[0].validationStatus).toBe("not_validated");
    expect(repository.records[0].lastValidatedAt).toBeNull();
    expect(result.value.maskedSuffix).toBe("****1234");
    expectSafeMetadata(result.value);
  });

  it("does not expose short alpha vantage keys in safe metadata", async () => {
    // Arrange
    const repository = createFakeRepository();
    const service = createProviderApiKeyService({
      encryptProviderKey: () => ({
        ok: true,
        value: encryptedKeyA,
      }),
      providerKeyRepository: repository,
    });

    // Act
    const result = await service.saveProviderKey({
      providerId: "alpha_vantage",
      apiKey: "ABCD",
      enabled: true,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected provider key save success.");
    }
    expect(result.value.maskedSuffix).toBe("********");
    expect(result.value.maskedSuffix).not.toContain("ABCD");
    expect(repository.records[0].maskedSuffix).toBe("********");
    expect(repository.records[0].maskedSuffix).not.toContain("ABCD");
    expectSafeMetadata(result.value);
  });

  it("replaces an existing alpha vantage key instead of creating a second row", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const service = createProviderApiKeyService({
      encryptProviderKey: () => ({
        ok: true,
        value: encryptedKeyB,
      }),
      providerKeyRepository: repository,
    });

    // Act
    const result = await service.saveProviderKey({
      providerId: "alpha_vantage",
      apiKey: "replacement-alpha-key-5678",
      enabled: false,
    });

    // Assert
    expect(result.ok).toBe(true);
    expect(repository.records).toHaveLength(1);
    expect(repository.records[0].encryptedKey).toBe("encrypted-b");
    expect(repository.records[0].maskedSuffix).toBe("****5678");
    expect(repository.records[0].enabled).toBe(false);
    expect(repository.records[0].validationStatus).toBe("not_validated");
  });

  it("rejects unsupported provider key saves before encryption or repository writes", async () => {
    // Arrange
    const repository = createFakeRepository();
    const encryptedInputs: string[] = [];
    const service = createProviderApiKeyService({
      encryptProviderKey: (apiKey) => {
        encryptedInputs.push(apiKey);
        return {
          ok: true,
          value: encryptedKeyA,
        };
      },
      providerKeyRepository: repository,
    });

    // Act
    const sampleResult = await service.saveProviderKey({
      providerId: "sample",
      apiKey: "sample-key",
      enabled: true,
    });
    const twelveDataResult = await service.saveProviderKey({
      providerId: "twelve_data",
      apiKey: "twelve-data-key",
      enabled: true,
    });

    // Assert
    expect(sampleResult.ok).toBe(false);
    expect(twelveDataResult.ok).toBe(false);
    expect(encryptedInputs).toEqual([]);
    expect(repository.upsertCalls).toEqual([]);
    expect(repository.records).toEqual([]);
  });

  it("persists disabled state while keeping safe metadata", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const service = createProviderApiKeyService({
      providerKeyRepository: repository,
    });

    // Act
    const result = await service.setProviderKeyEnabled("alpha_vantage", false);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected provider key disable success.");
    }
    expect(result.value.enabled).toBe(false);
    expect(repository.records[0].enabled).toBe(false);
    expectSafeMetadata(result.value);
  });

  it("rejects unsupported provider enable and delete requests before mutation", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const service = createProviderApiKeyService({
      providerKeyRepository: repository,
    });

    // Act
    const sampleEnableResult = await service.setProviderKeyEnabled(
      "sample",
      false,
    );
    const twelveDataEnableResult = await service.setProviderKeyEnabled(
      "twelve_data",
      false,
    );
    const sampleDeleteResult = await service.deleteProviderKey("sample");
    const twelveDataDeleteResult =
      await service.deleteProviderKey("twelve_data");

    // Assert
    expect(sampleEnableResult.ok).toBe(false);
    expect(twelveDataEnableResult.ok).toBe(false);
    expect(sampleDeleteResult.ok).toBe(false);
    expect(twelveDataDeleteResult.ok).toBe(false);
    expect(repository.setEnabledCalls).toEqual([]);
    expect(repository.deleteCalls).toEqual([]);
    expect(repository.records).toHaveLength(1);
  });

  it("deletes alpha vantage provider keys", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const service = createProviderApiKeyService({
      providerKeyRepository: repository,
    });

    // Act
    const result = await service.deleteProviderKey("alpha_vantage");

    // Assert
    expect(result).toEqual({
      ok: true,
      deleted: true,
    });
    expect(repository.records).toEqual([]);
  });

  it("lists only safe provider key metadata", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const service = createProviderApiKeyService({
      providerKeyRepository: repository,
    });

    // Act
    const metadata = await service.listProviderKeys();

    // Assert
    expect(metadata).toHaveLength(1);
    expect(metadata[0].providerLabel).toBe("Alpha Vantage");
    expectSafeMetadata(metadata[0]);
  });
});
