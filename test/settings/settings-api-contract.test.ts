import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettings } from "@/modules/settings/domain/app-settings";
import type { ProviderApiKeyMetadata } from "@/modules/settings/domain/provider-api-key";

const serviceMocks = vi.hoisted(() => ({
  providerApiKeyService: {
    deleteProviderKey: vi.fn(),
    listProviderKeys: vi.fn(),
    saveProviderKey: vi.fn(),
    setProviderKeyEnabled: vi.fn(),
  },
  providerKeyValidationService: {
    validateProviderKey: vi.fn(),
  },
  settingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

vi.mock("@/modules/settings/server/service-singleton", () => ({
  getProviderApiKeyService: () => serviceMocks.providerApiKeyService,
  getProviderKeyValidationService: () =>
    serviceMocks.providerKeyValidationService,
  getSettingsService: () => serviceMocks.settingsService,
}));

const settingsRoute = await import("@/app/api/settings/route");
const providerKeysRoute = await import(
  "@/app/api/settings/provider-keys/route"
);
const providerKeyRoute = await import(
  "@/app/api/settings/provider-keys/[providerId]/route"
);
const providerKeyValidateRoute = await import(
  "@/app/api/settings/provider-keys/[providerId]/validate/route"
);

const fixedDate = new Date("2026-04-26T12:00:00.000Z");
const rawProviderKey = "raw-alpha-provider-key";
const fallbackProviderKey = "environment-alpha-provider-key";

const settings: AppSettings = {
  defaultProvider: "alpha_vantage",
  missingDataBehavior: "confirm_before_fetch",
  showSampleData: false,
};

const metadata: ProviderApiKeyMetadata = {
  providerId: "alpha_vantage",
  providerLabel: "Alpha Vantage",
  enabled: true,
  maskedSuffix: "****1234",
  validationStatus: "valid",
  validationMessage: "provider_key_validated",
  lastValidatedAt: fixedDate,
  createdAt: fixedDate,
  updatedAt: fixedDate,
};

type RouteContext = {
  params: Promise<{
    providerId: string;
  }>;
};

function requestWithJson(url: string, body: unknown): Request {
  return new Request(url, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
}

function providerContext(providerId: string): RouteContext {
  return {
    params: Promise.resolve({
      providerId,
    }),
  };
}

async function jsonBody(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function unsafeFieldNames(): string[] {
  return [
    "api" + "Key",
    "encrypted" + "Key",
    "encryption" + "Iv",
    "encryption" + "AuthTag",
    "encrypted_" + "key",
    "encryption_" + "iv",
    "encryption_" + "auth_tag",
  ];
}

function expectSafeBody(body: unknown): void {
  const serializedBody = JSON.stringify(body);

  expect(serializedBody).not.toContain(rawProviderKey);
  expect(serializedBody).not.toContain(fallbackProviderKey);
  for (const fieldName of unsafeFieldNames()) {
    expect(serializedBody).not.toContain(fieldName);
  }
}

function unsupportedProviderResult(providerId: "sample" | "twelve_data") {
  return {
    ok: false,
    fieldErrors: {
      providerId: `Saved keys are not supported for ${providerId}.`,
    },
    message: `Saved keys are not supported for ${providerId}.`,
  };
}

describe("settings api contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALPHA_VANTAGE_API_KEY = fallbackProviderKey;
    serviceMocks.settingsService.getSettings.mockResolvedValue({
      ok: true,
      value: settings,
    });
    serviceMocks.settingsService.updateSettings.mockImplementation(
      async (rawInput: AppSettings) => {
        if (rawInput.defaultProvider !== "alpha_vantage") {
          return {
            ok: false,
            fieldErrors: {
              defaultProvider: "Invalid option",
            },
            formErrors: [],
          };
        }

        return {
          ok: true,
          value: rawInput,
        };
      },
    );
    serviceMocks.providerApiKeyService.listProviderKeys.mockResolvedValue([
      metadata,
    ]);
    serviceMocks.providerApiKeyService.saveProviderKey.mockImplementation(
      async (rawInput: { providerId: string }) => {
        if (rawInput.providerId === "sample") {
          return unsupportedProviderResult("sample");
        }

        if (rawInput.providerId === "twelve_data") {
          return unsupportedProviderResult("twelve_data");
        }

        return {
          ok: true,
          value: metadata,
        };
      },
    );
    serviceMocks.providerApiKeyService.setProviderKeyEnabled.mockImplementation(
      async (providerId: string, enabled: boolean) => {
        if (providerId === "sample") {
          return unsupportedProviderResult("sample");
        }

        if (providerId === "twelve_data") {
          return unsupportedProviderResult("twelve_data");
        }

        return {
          ok: true,
          value: {
            ...metadata,
            enabled,
          },
        };
      },
    );
    serviceMocks.providerApiKeyService.deleteProviderKey.mockImplementation(
      async (providerId: string) => {
        if (providerId === "sample" || providerId === "twelve_data") {
          return {
            ok: false,
            fieldErrors: {
              providerId: "Saved keys are not supported for this provider.",
            },
            message: "Saved keys are not supported for this provider.",
          };
        }

        return {
          ok: true,
          deleted: true,
        };
      },
    );
    serviceMocks.providerKeyValidationService.validateProviderKey.mockImplementation(
      async (providerId: string) => {
        if (providerId === "sample" || providerId === "twelve_data") {
          return {
            ok: false,
            code: "unsupported_provider",
            message: "Provider key validation is not supported.",
          };
        }

        return {
          ok: true,
          value: metadata,
        };
      },
    );
  });

  it("returns settings, provider descriptors, key metadata, and fallback booleans", async () => {
    // Arrange / Act
    const response = await settingsRoute.GET();
    const body = await jsonBody(response);

    // Assert
    expect(response.status).toBe(200);
    expect(body.settings).toMatchObject(settings);
    expect(body.providerKeys).toHaveLength(1);
    expect(body.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "alpha_vantage",
          isSelectableDefault: true,
        }),
      ]),
    );
    expect(body.selectableDefaultProviderIds).toEqual(["alpha_vantage"]);
    expect(body.environmentFallbacks).toEqual([
      {
        providerId: "alpha_vantage",
        name: "ALPHA_VANTAGE_API_KEY",
        configured: true,
      },
    ]);
    expectSafeBody(body);
  });

  it("returns field errors for unsupported settings values", async () => {
    // Arrange
    const request = requestWithJson("http://local.test/api/settings", {
      defaultProvider: "sample",
      missingDataBehavior: "confirm_before_fetch",
      showSampleData: false,
    });

    // Act
    const response = await settingsRoute.PUT(request);
    const body = await jsonBody(response);

    // Assert
    expect(response.status).toBe(400);
    expect(body.fieldErrors).toMatchObject({
      defaultProvider: "Invalid option",
    });
  });

  it("accepts alpha vantage and rejects sample and twelve data defaults", async () => {
    // Arrange
    const alphaRequest = requestWithJson("http://local.test/api/settings", {
      defaultProvider: "alpha_vantage",
      missingDataBehavior: "silent_fetch",
      showSampleData: false,
    });
    const sampleRequest = requestWithJson("http://local.test/api/settings", { defaultProvider: "sample", missingDataBehavior: "confirm_before_fetch", showSampleData: false });
    const twelveDataRequest = requestWithJson("http://local.test/api/settings", { defaultProvider: "twelve_data", missingDataBehavior: "confirm_before_fetch", showSampleData: false });

    // Act
    const alphaResponse = await settingsRoute.PUT(alphaRequest);
    const sampleResponse = await settingsRoute.PUT(sampleRequest);
    const twelveDataResponse = await settingsRoute.PUT(twelveDataRequest);

    // Assert
    expect(alphaResponse.status).toBe(200);
    expect(sampleResponse.status).toBe(400);
    expect(twelveDataResponse.status).toBe(400);
  });

  it("lists only safe provider key metadata", async () => {
    // Arrange / Act
    const response = await providerKeysRoute.GET();
    const body = await jsonBody(response);

    // Assert
    expect(response.status).toBe(200);
    expect(body.providerKeys).toHaveLength(1);
    expectSafeBody(body);
  });

  it("creates alpha vantage provider keys while returning metadata only", async () => {
    // Arrange
    const request = requestWithJson(
      "http://local.test/api/settings/provider-keys",
      {
        providerId: "alpha_vantage",
        apiKey: rawProviderKey,
      },
    );

    // Act
    const response = await providerKeysRoute.POST(request);
    const body = await jsonBody(response);

    // Assert
    expect(response.status).toBe(201);
    expect(serviceMocks.providerApiKeyService.saveProviderKey).toHaveBeenCalledWith(
      {
        providerId: "alpha_vantage",
        apiKey: rawProviderKey,
        enabled: true,
      },
    );
    expect(body.providerKey).toMatchObject({
      providerId: "alpha_vantage",
      maskedSuffix: "****1234",
    });
    expectSafeBody(body);
  });

  it("rejects sample and twelve data provider key creates safely", async () => {
    // Arrange
    const sampleRequest = requestWithJson("http://local.test/api/settings/provider-keys", { providerId: "sample", apiKey: rawProviderKey });
    const twelveDataRequest = requestWithJson("http://local.test/api/settings/provider-keys", { providerId: "twelve_data", apiKey: rawProviderKey });

    // Act
    const sampleResponse = await providerKeysRoute.POST(sampleRequest);
    const twelveDataResponse = await providerKeysRoute.POST(twelveDataRequest);

    // Assert
    expect(sampleResponse.status).toBe(400);
    expect(twelveDataResponse.status).toBe(400);
    expectSafeBody(await jsonBody(sampleResponse));
    expectSafeBody(await jsonBody(twelveDataResponse));
  });

  it("updates provider keys by replacement, enabled toggle, and delete", async () => {
    // Arrange
    const replacementRequest = requestWithJson(
      "http://local.test/api/settings/provider-keys/alpha_vantage",
      {
        apiKey: rawProviderKey,
      },
    );
    const toggleRequest = requestWithJson(
      "http://local.test/api/settings/provider-keys/alpha_vantage",
      {
        enabled: false,
      },
    );

    // Act
    const replacementResponse = await providerKeyRoute.PUT(
      replacementRequest,
      providerContext("alpha_vantage"),
    );
    const toggleResponse = await providerKeyRoute.PUT(
      toggleRequest,
      providerContext("alpha_vantage"),
    );
    const deleteResponse = await providerKeyRoute.DELETE(
      new Request("http://local.test/api/settings/provider-keys/alpha_vantage"),
      providerContext("alpha_vantage"),
    );

    // Assert
    expect(replacementResponse.status).toBe(200);
    expect(toggleResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(serviceMocks.providerApiKeyService.saveProviderKey).toHaveBeenCalledWith(
      {
        providerId: "alpha_vantage",
        apiKey: rawProviderKey,
        enabled: true,
      },
    );
    expect(
      serviceMocks.providerApiKeyService.setProviderKeyEnabled,
    ).toHaveBeenCalledWith("alpha_vantage", false);
    expect(
      serviceMocks.providerApiKeyService.deleteProviderKey,
    ).toHaveBeenCalledWith("alpha_vantage");
  });

  it("rejects sample and twelve data provider key route actions safely", async () => {
    // Arrange
    const samplePutRequest = requestWithJson("http://local.test/api/settings/provider-keys/sample", { providerId: "sample", enabled: true });
    const twelveDataPutRequest = requestWithJson("http://local.test/api/settings/provider-keys/twelve_data", { providerId: "twelve_data", enabled: true });

    // Act
    const samplePutResponse = await providerKeyRoute.PUT(
      samplePutRequest,
      providerContext("sample"),
    );
    const twelveDataPutResponse = await providerKeyRoute.PUT(
      twelveDataPutRequest,
      providerContext("twelve_data"),
    );
    const sampleDeleteResponse = await providerKeyRoute.DELETE(
      new Request("http://local.test/api/settings/provider-keys/sample"),
      providerContext("sample"),
    );
    const twelveDataValidateResponse = await providerKeyValidateRoute.POST(
      new Request(
        "http://local.test/api/settings/provider-keys/twelve_data/validate",
        {
          method: "POST",
        },
      ),
      providerContext("twelve_data"),
    );

    // Assert
    expect(samplePutResponse.status).toBe(400);
    expect(twelveDataPutResponse.status).toBe(400);
    expect(sampleDeleteResponse.status).toBe(400);
    expect(twelveDataValidateResponse.status).toBe(400);
    expectSafeBody(await jsonBody(samplePutResponse));
    expectSafeBody(await jsonBody(twelveDataValidateResponse));
  });

  it("validates alpha vantage provider keys explicitly with sanitized metadata", async () => {
    // Arrange
    const request = new Request(
      "http://local.test/api/settings/provider-keys/alpha_vantage/validate",
      {
        method: "POST",
      },
    );

    // Act
    const response = await providerKeyValidateRoute.POST(
      request,
      providerContext("alpha_vantage"),
    );
    const body = await jsonBody(response);

    // Assert
    expect(response.status).toBe(200);
    expect(
      serviceMocks.providerKeyValidationService.validateProviderKey,
    ).toHaveBeenCalledWith("alpha_vantage");
    expect(body.providerKey).toMatchObject({
      providerId: "alpha_vantage",
      validationStatus: "valid",
    });
    expectSafeBody(body);
  });
});
