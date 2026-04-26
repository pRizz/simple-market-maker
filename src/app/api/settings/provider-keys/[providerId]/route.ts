import { NextResponse } from "next/server";

import {
  providerIds,
  type ProviderId,
} from "@/modules/settings/domain/app-settings";
import { getProviderApiKeyService } from "@/modules/settings/server/service-singleton";

type ProviderKeyRouteContext = {
  params: Promise<{
    providerId: string;
  }>;
};

function maybeProviderId(value: string): ProviderId | null {
  if (!providerIds.includes(value as ProviderId)) {
    return null;
  }

  return value as ProviderId;
}

function providerNotFoundResponse(): Response {
  return NextResponse.json(
    {
      message: "Provider was not found.",
    },
    { status: 404 },
  );
}

function providerKeyUpdateInput(
  providerId: ProviderId,
  rawInput: Record<string, unknown>,
): unknown {
  return {
    providerId,
    apiKey: rawInput.apiKey,
    enabled: typeof rawInput.enabled === "boolean" ? rawInput.enabled : true,
  };
}

function invalidProviderKeyUpdateResponse(): Response {
  return NextResponse.json(
    {
      ok: false,
      fieldErrors: {
        apiKey: "Enter a provider API key or choose an enabled state.",
        enabled: "Enter a provider API key or choose an enabled state.",
      },
      message: "Provider key update input is invalid.",
    },
    { status: 400 },
  );
}

export async function PUT(
  request: Request,
  context: ProviderKeyRouteContext,
): Promise<Response> {
  const { providerId: rawProviderId } = await context.params;
  const maybePathProviderId = maybeProviderId(rawProviderId);

  if (!maybePathProviderId) {
    return providerNotFoundResponse();
  }

  const rawInput = await request.json();
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    return invalidProviderKeyUpdateResponse();
  }

  const input = rawInput as Record<string, unknown>;
  if (typeof input.apiKey === "string") {
    const result = await getProviderApiKeyService().saveProviderKey(
      providerKeyUpdateInput(maybePathProviderId, input),
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ providerKey: result.value });
  }

  if (typeof input.enabled === "boolean") {
    const result = await getProviderApiKeyService().setProviderKeyEnabled(
      maybePathProviderId,
      input.enabled,
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ providerKey: result.value });
  }

  return invalidProviderKeyUpdateResponse();
}

export async function DELETE(
  _request: Request,
  context: ProviderKeyRouteContext,
): Promise<Response> {
  const { providerId: rawProviderId } = await context.params;
  const maybePathProviderId = maybeProviderId(rawProviderId);

  if (!maybePathProviderId) {
    return providerNotFoundResponse();
  }

  const result =
    await getProviderApiKeyService().deleteProviderKey(maybePathProviderId);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
