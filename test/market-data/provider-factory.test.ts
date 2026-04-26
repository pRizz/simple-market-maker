import { describe, expect, it, vi } from "vitest";

import type { FetchLike } from "@/modules/market-data/server/alpha-vantage-market-data-provider";
import { providerForSource } from "@/modules/market-data/server/provider-factory";
import { SampleMarketDataFetchProvider } from "@/modules/market-data/server/sample-market-data-fetch-provider";
import type { ProviderCredentialResolution } from "@/modules/settings/server/provider-credential-resolver";

vi.mock("server-only", () => ({}));

function dailySeriesBody(): unknown {
  return {
    "Time Series (Daily)": {
      "2024-01-03": {
        "1. open": "103.00",
        "2. high": "106.00",
        "3. low": "102.00",
        "4. close": "105.00",
        "5. volume": "3000",
      },
      "2024-01-02": {
        "1. open": "101.00",
        "2. high": "104.00",
        "3. low": "100.00",
        "4. close": "103.00",
        "5. volume": "2000",
      },
    },
  };
}

function successfulFetch(body: unknown): FetchLike {
  return async () => ({
    json: async () => body,
    ok: true,
    status: 200,
    statusText: "OK",
  });
}

function alphaVantageInput() {
  return {
    ticker: "MSFT",
    interval: "daily" as const,
    startDate: new Date("2024-01-02T00:00:00.000Z"),
    endDate: new Date("2024-01-03T00:00:00.000Z"),
  };
}

function createCredentialResolver(result: ProviderCredentialResolution) {
  return {
    resolveProviderCredential: vi.fn(async () => result),
  };
}

describe("providerForSource", () => {
  it("returns the sample provider without resolving credentials", async () => {
    // Arrange
    const credentialResolver = createCredentialResolver({
      kind: "missing",
      providerId: "alpha_vantage",
      message: "Alpha Vantage provider key is not configured.",
    });

    // Act
    const provider = await providerForSource("sample", {
      credentialResolver,
    });

    // Assert
    expect(provider).toBeInstanceOf(SampleMarketDataFetchProvider);
    expect(credentialResolver.resolveProviderCredential).not.toHaveBeenCalled();
  });

  it("resolves Alpha Vantage credentials before constructing the provider", async () => {
    // Arrange
    const credentialResolver = createCredentialResolver({
      kind: "persisted",
      providerId: "alpha_vantage",
      apiKey: "persisted-test-key",
    });

    // Act
    await providerForSource("alpha_vantage", {
      credentialResolver,
      fetchFn: successfulFetch(dailySeriesBody()),
    });

    // Assert
    expect(credentialResolver.resolveProviderCredential).toHaveBeenCalledWith(
      "alpha_vantage",
    );
  });

  it("uses persisted Alpha Vantage credentials before an environment fallback", async () => {
    // Arrange
    const fetchFn = vi.fn(successfulFetch(dailySeriesBody()));
    const credentialResolver = createCredentialResolver({
      kind: "persisted",
      providerId: "alpha_vantage",
      apiKey: "persisted-test-key",
    });

    // Act
    const provider = await providerForSource("alpha_vantage", {
      credentialResolver,
      fetchFn,
    });
    await provider.fetchCandles(alphaVantageInput());

    // Assert
    const requestedUrl = fetchFn.mock.calls[0]?.[0];
    expect(requestedUrl).toBeInstanceOf(URL);
    expect((requestedUrl as URL).searchParams.get("apikey")).toBe(
      "persisted-test-key",
    );
    expect((requestedUrl as URL).searchParams.get("apikey")).not.toBe(
      "environment-test-key",
    );
  });

  it("uses environment Alpha Vantage credentials when no saved key resolves", async () => {
    // Arrange
    const fetchFn = vi.fn(successfulFetch(dailySeriesBody()));
    const credentialResolver = createCredentialResolver({
      kind: "environment",
      providerId: "alpha_vantage",
      apiKey: "environment-test-key",
      environmentName: "ALPHA_VANTAGE_API_KEY",
    });

    // Act
    const provider = await providerForSource("alpha_vantage", {
      credentialResolver,
      fetchFn,
    });
    await provider.fetchCandles(alphaVantageInput());

    // Assert
    const requestedUrl = fetchFn.mock.calls[0]?.[0];
    expect(requestedUrl).toBeInstanceOf(URL);
    expect((requestedUrl as URL).searchParams.get("apikey")).toBe(
      "environment-test-key",
    );
  });

  it("returns a safe provider failure when Alpha Vantage credentials are missing", async () => {
    // Arrange
    const credentialResolver = createCredentialResolver({
      kind: "missing",
      providerId: "alpha_vantage",
      message: "Alpha Vantage provider key is not configured.",
    });

    // Act
    const provider = await providerForSource("alpha_vantage", {
      credentialResolver,
      fetchFn: successfulFetch(dailySeriesBody()),
    });

    // Assert
    await expect(provider.fetchCandles(alphaVantageInput())).rejects.toThrow(
      "Alpha Vantage provider key is not configured.",
    );
    await expect(provider.fetchCandles(alphaVantageInput())).rejects.not.toThrow(
      "environment-test-key",
    );
  });
});
