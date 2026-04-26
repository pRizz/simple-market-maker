import { describe, expect, it, vi } from "vitest";

import type { ProviderId } from "@/modules/settings/domain/app-settings";
import type {
  ProviderApiKeyRecord,
  ProviderApiKeyRepository,
  ProviderApiKeyUpsertInput,
  ProviderApiKeyValidationUpdate,
} from "@/modules/settings/server/provider-api-key-repository";
import { createProviderApiKeyService } from "@/modules/settings/server/provider-api-key-service";
import { createProviderKeyValidationService } from "@/modules/settings/server/provider-key-validation-service";
import type {
  EncryptedProviderApiKey,
  ProviderKeyDecryptionResult,
} from "@/modules/settings/server/provider-key-encryption";

vi.mock("server-only", () => ({}));

const fixedDate = new Date("2026-04-26T12:00:00.000Z");
const rawApiKey = "alpha-raw-validation-key";
const encryptedKey: EncryptedProviderApiKey = {
  encryptedKey: "encrypted-alpha",
  encryptionIv: "iv-alpha",
  encryptionAuthTag: "tag-alpha",
};

type FakeProviderKeyRepository = ProviderApiKeyRepository & {
  deleteCalls: ProviderId[];
  getCalls: ProviderId[];
  records: ProviderApiKeyRecord[];
  setEnabledCalls: ProviderId[];
  updateValidationCalls: ProviderApiKeyValidationUpdate[];
  upsertCalls: ProviderApiKeyUpsertInput[];
};

function providerKeyRecord(
  overrides: Partial<ProviderApiKeyRecord> = {},
): ProviderApiKeyRecord {
  return {
    id: "key-alpha-vantage",
    providerId: "alpha_vantage",
    ...encryptedKey,
    maskedSuffix: "****tion",
    enabled: true,
    validationStatus: "not_validated",
    validationMessage: null,
    lastValidatedAt: null,
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
    getCalls: [],
    records: [...initialRecords],
    setEnabledCalls: [],
    updateValidationCalls: [],
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
      repository.getCalls.push(providerId);

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

    async updateProviderKeyValidation(providerId, validation) {
      repository.updateValidationCalls.push(validation);
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
      const nextRecord = providerKeyRecord({
        ...record,
        id: `key-${record.providerId}`,
        validationStatus: "not_validated",
        validationMessage: null,
        lastValidatedAt: null,
      });

      repository.records.push(nextRecord);

      return nextRecord;
    },
  };

  return repository;
}

function successfulAlphaVantageBody(): unknown {
  return {
    "Time Series (Daily)": {
      "2026-04-24": {
        "1. open": "100.00",
        "2. high": "101.00",
        "3. low": "99.00",
        "4. close": "100.50",
        "5. volume": "1000000",
      },
    },
  };
}

function responseForBody(body: unknown, ok = true): Response {
  return {
    json: async () => body,
    ok,
    status: ok ? 200 : 503,
    statusText: ok ? "OK" : "Service Unavailable",
  } as Response;
}

function serialize(value: unknown): string {
  return JSON.stringify(value);
}

function expectNoSecretMaterial(value: unknown): void {
  const serializedValue = serialize(value);

  expect(serializedValue).not.toContain(rawApiKey);
  expect(serializedValue).not.toContain("apikey=");
  expect(serializedValue).not.toContain("https://www.alphavantage.co/query");
  expect(serializedValue).not.toContain("responseBody");
  expect(serializedValue).not.toContain("encrypted-alpha");
  expect(serializedValue).not.toContain("iv-alpha");
  expect(serializedValue).not.toContain("tag-alpha");
}

describe("provider key validation service", () => {
  it("validates alpha vantage by decrypting the saved key and storing safe metadata", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const decryptedRecords: EncryptedProviderApiKey[] = [];
    const fetchCalls: URL[] = [];
    const service = createProviderKeyValidationService({
      decryptProviderKey: (record) => {
        decryptedRecords.push(record);
        return {
          ok: true,
          value: rawApiKey,
        };
      },
      fetchFn: async (input) => {
        if (!(input instanceof URL)) {
          throw new Error("Expected validation to call fetch with a URL.");
        }

        fetchCalls.push(input);

        return responseForBody(successfulAlphaVantageBody());
      },
      now: () => fixedDate,
      providerKeyRepository: repository,
    });

    // Act
    const result = await service.validateProviderKey("alpha_vantage");

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected validation success.");
    }
    expect(decryptedRecords).toHaveLength(1);
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].searchParams.get("function")).toBe(
      "TIME_SERIES_DAILY",
    );
    expect(fetchCalls[0].searchParams.get("symbol")).toBe("IBM");
    expect(fetchCalls[0].searchParams.get("apikey")).toBe(rawApiKey);
    expect(repository.updateValidationCalls).toEqual([
      {
        validationStatus: "valid",
        validationMessage: "provider_key_validated",
        lastValidatedAt: fixedDate,
      },
    ]);
    expect(result.value.validationStatus).toBe("valid");
    expect(result.value.validationMessage).toBe("provider_key_validated");
    expect(result.value.lastValidatedAt).toBe(fixedDate);
    expectNoSecretMaterial(result);
  });

  it("does not validate saved keys during metadata listing", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const fetchFn = vi.fn();
    const service = createProviderApiKeyService({
      providerKeyRepository: repository,
    });

    // Act
    const metadata = await service.listProviderKeys();

    // Assert
    expect(metadata).toHaveLength(1);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(repository.updateValidationCalls).toEqual([]);
  });

  it("stores an invalid safe message code for rejected provider responses", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const service = createProviderKeyValidationService({
      decryptProviderKey: () => ({
        ok: true,
        value: rawApiKey,
      }),
      fetchFn: async () =>
        responseForBody({
          "Error Message": `Invalid apikey=${rawApiKey} responseBody={"bad":true}`,
        }),
      now: () => fixedDate,
      providerKeyRepository: repository,
    });

    // Act
    const result = await service.validateProviderKey("alpha_vantage");

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected validation metadata update.");
    }
    expect(repository.updateValidationCalls).toEqual([
      {
        validationStatus: "invalid",
        validationMessage: "provider_rejected_key",
        lastValidatedAt: fixedDate,
      },
    ]);
    expect(result.value.validationStatus).toBe("invalid");
    expect(result.value.validationMessage).toBe("provider_rejected_key");
    expectNoSecretMaterial(result);
  });

  it("sanitizes raw provider urls, apikey values, keys, and response bodies", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const service = createProviderKeyValidationService({
      decryptProviderKey: () => ({
        ok: true,
        value: rawApiKey,
      }),
      fetchFn: async () => {
        throw new Error(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&apikey=${rawApiKey} responseBody={"secret":"${rawApiKey}"}`,
        );
      },
      now: () => fixedDate,
      providerKeyRepository: repository,
    });

    // Act
    const result = await service.validateProviderKey("alpha_vantage");

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected validation metadata update.");
    }
    expect(result.value.validationStatus).toBe("invalid");
    expect(result.value.validationMessage).toBe("provider_unavailable");
    expect(repository.records[0].validationMessage).toBe(
      "provider_unavailable",
    );
    expectNoSecretMaterial(result);
  });

  it("rejects sample and twelve data validation before decrypting, fetching, or mutating", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const decryptProviderKey = vi.fn(
      (): ProviderKeyDecryptionResult => ({
        ok: true,
        value: rawApiKey,
      }),
    );
    const fetchFn = vi.fn();
    const service = createProviderKeyValidationService({
      decryptProviderKey,
      fetchFn,
      now: () => fixedDate,
      providerKeyRepository: repository,
    });

    // Act
    const sampleResult = await service.validateProviderKey("sample");
    const twelveDataResult = await service.validateProviderKey("twelve_data");

    // Assert
    expect(sampleResult.ok).toBe(false);
    expect(twelveDataResult.ok).toBe(false);
    expect(serialize(sampleResult)).toContain("unsupported_provider");
    expect(serialize(twelveDataResult)).toContain("unsupported_provider");
    expect(repository.getCalls).toEqual([]);
    expect(repository.updateValidationCalls).toEqual([]);
    expect(decryptProviderKey).not.toHaveBeenCalled();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("fails closed with a safe message when saved-key decryption is unavailable", async () => {
    // Arrange
    const repository = createFakeRepository([providerKeyRecord()]);
    const service = createProviderKeyValidationService({
      decryptProviderKey: () => ({
        ok: false,
        code: "missing_encryption_secret",
      }),
      fetchFn: vi.fn(),
      now: () => fixedDate,
      providerKeyRepository: repository,
    });

    // Act
    const result = await service.validateProviderKey("alpha_vantage");

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected validation metadata update.");
    }
    expect(result.value.validationStatus).toBe("invalid");
    expect(result.value.validationMessage).toBe("missing_provider_key");
    expect(repository.updateValidationCalls).toEqual([
      {
        validationStatus: "invalid",
        validationMessage: "missing_provider_key",
        lastValidatedAt: fixedDate,
      },
    ]);
    expectNoSecretMaterial(result);
  });
});
