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

type MarketDataServiceDependencies = {
  marketDataChunkRepository?: MarketDataChunkRepository;
  providerFactory?: (source: MarketDataSource) => MarketDataFetchProvider;
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

      try {
        const provider = makeProvider(parsedInput.value.source);
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
        const message =
          error instanceof Error
            ? error.message
            : "Market data fetch failed.";

        return formErrorResult(message);
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
