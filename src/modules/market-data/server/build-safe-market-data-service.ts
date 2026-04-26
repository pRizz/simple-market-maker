import "server-only";

import type { MarketDataChunkRecord } from "@/modules/market-data/domain/market-data-chunk";
import {
  createMarketDataService,
  type MarketDataService,
} from "@/modules/market-data/server/market-data-service";

function isBuildPhase(): boolean {
  return !process.env.DATABASE_URL;
}

function unavailableChunk(chunkId: string): MarketDataChunkRecord {
  const now = new Date();

  return {
    id: chunkId,
    ticker: "Unavailable",
    source: "sample",
    interval: "daily",
    startDate: now,
    endDate: now,
    candleCount: 0,
    candles: [],
    notes: "Database unavailable during build.",
    fetchedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function getBuildSafeMarketDataService(): MarketDataService {
  if (!isBuildPhase()) {
    return createMarketDataService();
  }

  return {
    async listChunks() {
      return [];
    },

    async getChunk() {
      return null;
    },

    async createChunk() {
      return {
        ok: false,
        fieldErrors: {},
        formErrors: ["Database unavailable during build."],
      };
    },

    async deleteChunk() {
      return false;
    },

    async findMatchingChunk() {
      return null;
    },
  } satisfies MarketDataService;
}

export function unavailableMarketDataChunk(chunkId: string): MarketDataChunkRecord {
  return unavailableChunk(chunkId);
}
