import "server-only";

import {
  filterCandlesByDateRange,
  sortCandlesAscending,
} from "@/modules/market-data/domain/candle-series";
import type {
  MarketDataChunkRecord,
  MarketDataSource,
} from "@/modules/market-data/domain/market-data-chunk";
import {
  maybeParseMarketDataChunk,
  type RawMarketDataChunkInput,
} from "@/modules/market-data/domain/market-data-validation";
import {
  createMarketDataChunkRepository,
  type MarketDataChunkRepository,
} from "@/modules/market-data/server/market-data-chunk-repository";
import type { MarketDataFetchProvider } from "@/modules/market-data/server/market-data-provider";
import { providerForSource } from "@/modules/market-data/server/provider-factory";
import {
  createSettingsService,
  type SettingsService,
} from "@/modules/settings/server/settings-service";
import { sanitizeProviderError } from "@/modules/settings/server/provider-error-sanitizer";

type MarketDataServiceDependencies = {
  marketDataChunkRepository?: MarketDataChunkRepository;
  providerFactory?: (
    source: MarketDataSource,
  ) => Promise<MarketDataFetchProvider>;
  settingsService?: Pick<SettingsService, "getSettings">;
};

type CreateMarketDataChunkResult =
  | {
      chunk: MarketDataChunkRecord;
      ok: true;
    }
  | {
      fieldErrors: Record<string, string>;
      formErrors: string[];
      ok: false;
    };

function formErrorResult(message: string): CreateMarketDataChunkResult {
  return {
    ok: false,
    fieldErrors: {},
    formErrors: [message],
  };
}

function fieldErrorsFromParsedResult(
  fieldErrors: Partial<Record<keyof RawMarketDataChunkInput, string>>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter(([, maybeMessage]) => maybeMessage),
  ) as Record<string, string>;
}

export type MarketDataService = ReturnType<typeof createMarketDataService>;

export function createMarketDataService(
  dependencies: MarketDataServiceDependencies = {},
) {
  const marketDataChunkRepository =
    dependencies.marketDataChunkRepository ?? createMarketDataChunkRepository();
  const makeProvider = dependencies.providerFactory ?? providerForSource;
  const settingsService = dependencies.settingsService ?? createSettingsService();

  return {
    async createChunk(
      rawInput: RawMarketDataChunkInput,
    ): Promise<CreateMarketDataChunkResult> {
      const parsedInput = maybeParseMarketDataChunk(rawInput);

      if (!parsedInput.ok) {
        return {
          ok: false,
          fieldErrors: fieldErrorsFromParsedResult(parsedInput.fieldErrors),
          formErrors: parsedInput.formErrors,
        };
      }

      if (parsedInput.value.source === "sample") {
        const settingsResult = await settingsService.getSettings();

        if (!settingsResult.ok) {
          return formErrorResult(
            settingsResult.formErrors[0] ?? "Unable to load app settings.",
          );
        }

        if (!settingsResult.value.showSampleData) {
          return formErrorResult("Sample data is disabled in settings.");
        }
      }

      try {
        const provider = await makeProvider(parsedInput.value.source);
        const fetchedCandles = await provider.fetchCandles(parsedInput.value);
        const candles = filterCandlesByDateRange(
          sortCandlesAscending(fetchedCandles),
          parsedInput.value.startDate,
          parsedInput.value.endDate,
        );

        if (candles.length === 0) {
          return formErrorResult(
            "No candles were available for that ticker and date range.",
          );
        }

        const chunk = await marketDataChunkRepository.createChunk({
          candles,
          draft: parsedInput.value,
          fetchedAt: new Date(),
        });

        return {
          ok: true,
          chunk,
        };
      } catch (error) {
        return formErrorResult(sanitizeProviderError(error).message);
      }
    },

    async deleteChunk(chunkId: string): Promise<boolean> {
      return marketDataChunkRepository.deleteChunk(chunkId);
    },

    async getChunk(chunkId: string): Promise<MarketDataChunkRecord | null> {
      return marketDataChunkRepository.getChunkById(chunkId);
    },

    async listChunks(): Promise<MarketDataChunkRecord[]> {
      return marketDataChunkRepository.listChunks();
    },

    async findMatchingChunk(
      input: Parameters<MarketDataChunkRepository["findMatchingChunk"]>[0],
    ): Promise<MarketDataChunkRecord | null> {
      return marketDataChunkRepository.findMatchingChunk(input);
    },
  };
}

export type CreateMarketDataChunkResponse = CreateMarketDataChunkResult;
