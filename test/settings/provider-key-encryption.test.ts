import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  decryptProviderApiKey,
  encryptProviderApiKey,
} from "@/modules/settings/server/provider-key-encryption";

const originalEncryptionSecret = process.env.PROVIDER_KEYS_ENCRYPTION_SECRET;
const testEncryptionSecret = "test-provider-key-secret-with-32-bytes";
const plaintextKey = "alpha-vantage-test-key-1234";

function setEncryptionSecret(secret: string): void {
  process.env.PROVIDER_KEYS_ENCRYPTION_SECRET = secret;
}

describe("provider key encryption", () => {
  beforeEach(() => {
    // Arrange
    setEncryptionSecret(testEncryptionSecret);
  });

  afterEach(() => {
    // Arrange
    process.env.PROVIDER_KEYS_ENCRYPTION_SECRET = originalEncryptionSecret;
  });

  it("encrypts provider keys into base64 storage fields without echoing plaintext", () => {
    // Act
    const result = encryptProviderApiKey(plaintextKey);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected provider key encryption to succeed.");
    }
    expect(result.value.encryptedKey).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(result.value.encryptionIv).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(result.value.encryptionAuthTag).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(result.value.encryptedKey).not.toBe(plaintextKey);
    expect(result.value.encryptionIv).not.toBe(plaintextKey);
    expect(result.value.encryptionAuthTag).not.toBe(plaintextKey);
  });

  it("decrypts encrypted provider key storage fields with the same secret", () => {
    // Arrange
    const encryptedResult = encryptProviderApiKey(plaintextKey);
    if (!encryptedResult.ok) {
      throw new Error("Expected provider key encryption to succeed.");
    }

    // Act
    const decryptedResult = decryptProviderApiKey(encryptedResult.value);

    // Assert
    expect(decryptedResult.ok).toBe(true);
    if (!decryptedResult.ok) {
      throw new Error("Expected provider key decryption to succeed.");
    }
    expect(decryptedResult.value).toBe(plaintextKey);
  });

  it("fails closed when the encryption secret is missing", () => {
    // Arrange
    delete process.env.PROVIDER_KEYS_ENCRYPTION_SECRET;

    // Act
    const result = encryptProviderApiKey(plaintextKey);

    // Assert
    expect(result).toEqual({
      ok: false,
      code: "missing_encryption_secret",
    });
  });

  it("fails closed when the encryption secret is too short", () => {
    // Arrange
    setEncryptionSecret("short-secret");

    // Act
    const result = encryptProviderApiKey(plaintextKey);

    // Assert
    expect(result).toEqual({
      ok: false,
      code: "invalid_encryption_secret",
    });
  });

  it("fails closed when encrypted key material is tampered with", () => {
    // Arrange
    const encryptedResult = encryptProviderApiKey(plaintextKey);
    if (!encryptedResult.ok) {
      throw new Error("Expected provider key encryption to succeed.");
    }

    // Act
    const decryptedResult = decryptProviderApiKey({
      ...encryptedResult.value,
      encryptedKey: Buffer.from("tampered-key").toString("base64"),
    });

    // Assert
    expect(decryptedResult).toEqual({
      ok: false,
      code: "decryption_failed",
    });
  });

  it("fails closed when the encryption IV is tampered with", () => {
    // Arrange
    const encryptedResult = encryptProviderApiKey(plaintextKey);
    if (!encryptedResult.ok) {
      throw new Error("Expected provider key encryption to succeed.");
    }

    // Act
    const decryptedResult = decryptProviderApiKey({
      ...encryptedResult.value,
      encryptionIv: Buffer.from("tampered-iv!").toString("base64"),
    });

    // Assert
    expect(decryptedResult).toEqual({
      ok: false,
      code: "decryption_failed",
    });
  });

  it("fails closed when the encryption auth tag is tampered with", () => {
    // Arrange
    const encryptedResult = encryptProviderApiKey(plaintextKey);
    if (!encryptedResult.ok) {
      throw new Error("Expected provider key encryption to succeed.");
    }

    // Act
    const decryptedResult = decryptProviderApiKey({
      ...encryptedResult.value,
      encryptionAuthTag: Buffer.from("tampered-auth-tag").toString("base64"),
    });

    // Assert
    expect(decryptedResult).toEqual({
      ok: false,
      code: "decryption_failed",
    });
  });
});
