import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const algorithm = "aes-256-gcm";
const encryptionIvByteLength = 12;
const encryptionAuthTagByteLength = 16;
const minimumSecretByteLength = 32;

export type EncryptedProviderApiKey = {
  encryptedKey: string;
  encryptionIv: string;
  encryptionAuthTag: string;
};

export type ProviderKeyEncryptionFailureCode =
  | "missing_encryption_secret"
  | "invalid_encryption_secret"
  | "encryption_failed";

export type ProviderKeyDecryptionFailureCode =
  | "missing_encryption_secret"
  | "invalid_encryption_secret"
  | "decryption_failed";

export type ProviderKeyEncryptionResult =
  | {
      ok: true;
      value: EncryptedProviderApiKey;
    }
  | {
      ok: false;
      code: ProviderKeyEncryptionFailureCode;
    };

export type ProviderKeyDecryptionResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      code: ProviderKeyDecryptionFailureCode;
    };

type ProviderEncryptionSecretResult =
  | {
      ok: true;
      value: Buffer;
    }
  | {
      ok: false;
      code: "missing_encryption_secret" | "invalid_encryption_secret";
    };

function maybeProviderEncryptionSecret(): ProviderEncryptionSecretResult {
  const maybeSecret = process.env.PROVIDER_KEYS_ENCRYPTION_SECRET?.trim();

  if (!maybeSecret) {
    return {
      ok: false,
      code: "missing_encryption_secret",
    };
  }

  if (Buffer.byteLength(maybeSecret, "utf8") < minimumSecretByteLength) {
    return {
      ok: false,
      code: "invalid_encryption_secret",
    };
  }

  return {
    ok: true,
    value: createHash("sha256").update(maybeSecret, "utf8").digest(),
  };
}

export function encryptProviderApiKey(
  plaintextKey: string,
): ProviderKeyEncryptionResult {
  const encryptionSecret = maybeProviderEncryptionSecret();

  if (!encryptionSecret.ok) {
    return encryptionSecret;
  }

  try {
    const encryptionIv = randomBytes(encryptionIvByteLength);
    const cipher = createCipheriv(algorithm, encryptionSecret.value, encryptionIv, {
      authTagLength: encryptionAuthTagByteLength,
    });
    const encryptedKey = Buffer.concat([
      cipher.update(plaintextKey, "utf8"),
      cipher.final(),
    ]);
    const encryptionAuthTag = cipher.getAuthTag();

    return {
      ok: true,
      value: {
        encryptedKey: encryptedKey.toString("base64"),
        encryptionIv: encryptionIv.toString("base64"),
        encryptionAuthTag: encryptionAuthTag.toString("base64"),
      },
    };
  } catch {
    return {
      ok: false,
      code: "encryption_failed",
    };
  }
}

export function decryptProviderApiKey(
  record: EncryptedProviderApiKey,
): ProviderKeyDecryptionResult {
  const encryptionSecret = maybeProviderEncryptionSecret();

  if (!encryptionSecret.ok) {
    return encryptionSecret;
  }

  try {
    const encryptedKey = Buffer.from(record.encryptedKey, "base64");
    const encryptionIv = Buffer.from(record.encryptionIv, "base64");
    const encryptionAuthTag = Buffer.from(record.encryptionAuthTag, "base64");

    if (
      encryptionIv.length !== encryptionIvByteLength ||
      encryptionAuthTag.length !== encryptionAuthTagByteLength
    ) {
      return {
        ok: false,
        code: "decryption_failed",
      };
    }

    const decipher = createDecipheriv(
      algorithm,
      encryptionSecret.value,
      encryptionIv,
      {
        authTagLength: encryptionAuthTagByteLength,
      },
    );
    decipher.setAuthTag(encryptionAuthTag);

    return {
      ok: true,
      value: Buffer.concat([
        decipher.update(encryptedKey),
        decipher.final(),
      ]).toString("utf8"),
    };
  } catch {
    return {
      ok: false,
      code: "decryption_failed",
    };
  }
}
