import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDbOrThrow } from "@/modules/db/client";
import { providerApiKeysTable } from "@/modules/db/schema";
import {
  providerIds,
  type ProviderId,
} from "@/modules/settings/domain/app-settings";
import {
  providerKeyValidationStatuses,
  type ProviderKeyValidationStatus,
} from "@/modules/settings/domain/provider-api-key";
import type { EncryptedProviderApiKey } from "@/modules/settings/server/provider-key-encryption";

type ProviderApiKeyRow = typeof providerApiKeysTable.$inferSelect;

export type ProviderApiKeyRecord = EncryptedProviderApiKey & {
  id: string;
  providerId: ProviderId;
  maskedSuffix: string;
  enabled: boolean;
  validationStatus: ProviderKeyValidationStatus;
  validationMessage: string | null;
  lastValidatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProviderApiKeyUpsertInput = EncryptedProviderApiKey & {
  providerId: ProviderId;
  maskedSuffix: string;
  enabled: boolean;
};

export type ProviderApiKeyValidationUpdate = {
  validationStatus: ProviderKeyValidationStatus;
  validationMessage: string | null;
  lastValidatedAt: Date | null;
};

function providerIdFromRow(value: string): ProviderId {
  if (!providerIds.includes(value as ProviderId)) {
    throw new Error("Persisted provider key provider id is invalid.");
  }

  return value as ProviderId;
}

function validationStatusFromRow(value: string): ProviderKeyValidationStatus {
  if (
    !providerKeyValidationStatuses.includes(
      value as ProviderKeyValidationStatus,
    )
  ) {
    throw new Error("Persisted provider key validation status is invalid.");
  }

  return value as ProviderKeyValidationStatus;
}

function mapProviderApiKeyRow(row: ProviderApiKeyRow): ProviderApiKeyRecord {
  return {
    id: row.id,
    providerId: providerIdFromRow(row.providerId),
    encryptedKey: row.encryptedKey,
    encryptionIv: row.encryptionIv,
    encryptionAuthTag: row.encryptionAuthTag,
    maskedSuffix: row.maskedSuffix,
    enabled: row.enabled,
    validationStatus: validationStatusFromRow(row.validationStatus),
    validationMessage: row.validationMessage,
    lastValidatedAt: row.lastValidatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type ProviderApiKeyRepository = ReturnType<
  typeof createProviderApiKeyRepository
>;

export function createProviderApiKeyRepository() {
  return {
    async deleteProviderKey(providerId: ProviderId): Promise<boolean> {
      const deletedRows = await getDbOrThrow()
        .delete(providerApiKeysTable)
        .where(eq(providerApiKeysTable.providerId, providerId))
        .returning({ id: providerApiKeysTable.id });

      return deletedRows.length > 0;
    },

    async listProviderKeys(): Promise<ProviderApiKeyRecord[]> {
      const rows = await getDbOrThrow()
        .select()
        .from(providerApiKeysTable)
        .orderBy(asc(providerApiKeysTable.providerId));

      return rows.map(mapProviderApiKeyRow);
    },

    async maybeGetProviderKeyByProvider(
      providerId: ProviderId,
    ): Promise<ProviderApiKeyRecord | null> {
      const [row] = await getDbOrThrow()
        .select()
        .from(providerApiKeysTable)
        .where(eq(providerApiKeysTable.providerId, providerId))
        .limit(1);

      return row ? mapProviderApiKeyRow(row) : null;
    },

    async setProviderKeyEnabled(
      providerId: ProviderId,
      enabled: boolean,
    ): Promise<ProviderApiKeyRecord | null> {
      const [row] = await getDbOrThrow()
        .update(providerApiKeysTable)
        .set({
          enabled,
          updatedAt: new Date(),
        })
        .where(eq(providerApiKeysTable.providerId, providerId))
        .returning();

      return row ? mapProviderApiKeyRow(row) : null;
    },

    async updateProviderKeyValidation(
      providerId: ProviderId,
      validation: ProviderApiKeyValidationUpdate,
    ): Promise<ProviderApiKeyRecord | null> {
      const [row] = await getDbOrThrow()
        .update(providerApiKeysTable)
        .set({
          validationStatus: validation.validationStatus,
          validationMessage: validation.validationMessage,
          lastValidatedAt: validation.lastValidatedAt,
          updatedAt: new Date(),
        })
        .where(eq(providerApiKeysTable.providerId, providerId))
        .returning();

      return row ? mapProviderApiKeyRow(row) : null;
    },

    async upsertProviderKey(
      record: ProviderApiKeyUpsertInput,
    ): Promise<ProviderApiKeyRecord> {
      const now = new Date();
      const [row] = await getDbOrThrow()
        .insert(providerApiKeysTable)
        .values({
          providerId: record.providerId,
          encryptedKey: record.encryptedKey,
          encryptionIv: record.encryptionIv,
          encryptionAuthTag: record.encryptionAuthTag,
          maskedSuffix: record.maskedSuffix,
          enabled: record.enabled,
          validationStatus: "not_validated",
          validationMessage: null,
          lastValidatedAt: null,
        })
        .onConflictDoUpdate({
          target: providerApiKeysTable.providerId,
          set: {
            encryptedKey: record.encryptedKey,
            encryptionIv: record.encryptionIv,
            encryptionAuthTag: record.encryptionAuthTag,
            maskedSuffix: record.maskedSuffix,
            enabled: record.enabled,
            validationStatus: "not_validated",
            validationMessage: null,
            lastValidatedAt: null,
            updatedAt: now,
          },
        })
        .returning();

      return mapProviderApiKeyRow(row);
    },
  };
}
