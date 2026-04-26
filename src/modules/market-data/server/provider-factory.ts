import "server-only";

import type { MarketDataSource } from "@/modules/market-data/domain/market-data-chunk";
import {
  AlphaVantageMarketDataProvider,
  type FetchLike,
} from "@/modules/market-data/server/alpha-vantage-market-data-provider";
import type { MarketDataFetchProvider } from "@/modules/market-data/server/market-data-provider";
import { SampleMarketDataFetchProvider } from "@/modules/market-data/server/sample-market-data-fetch-provider";
import {
  createProviderCredentialResolver,
  type ProviderCredentialResolver,
} from "@/modules/settings/server/provider-credential-resolver";

export type ProviderFactoryDependencies = {
  credentialResolver?: Pick<
    ProviderCredentialResolver,
    "resolveProviderCredential"
  >;
  fetchFn?: FetchLike;
};

function missingAlphaVantageProvider(message: string): MarketDataFetchProvider {
  return {
    source: "alpha_vantage",
    async fetchCandles() {
      throw new Error(message);
    },
  };
}

export async function providerForSource(
  source: MarketDataSource,
  dependencies: ProviderFactoryDependencies = {},
): Promise<MarketDataFetchProvider> {
  if (source === "sample") {
    return new SampleMarketDataFetchProvider();
  }

  const credentialResolver =
    dependencies.credentialResolver ?? createProviderCredentialResolver();
  const credentialResolution =
    await credentialResolver.resolveProviderCredential("alpha_vantage");

  if (credentialResolution.kind === "missing") {
    return missingAlphaVantageProvider(credentialResolution.message);
  }

  return new AlphaVantageMarketDataProvider({
    apiKey: credentialResolution.apiKey,
    fetchFn: dependencies.fetchFn,
  });
}

export const createMarketDataProvider = providerForSource;
