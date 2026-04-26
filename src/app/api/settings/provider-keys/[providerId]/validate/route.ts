import { NextResponse } from "next/server";

import {
  providerIds,
  type ProviderId,
} from "@/modules/settings/domain/app-settings";
import { getProviderKeyValidationService } from "@/modules/settings/server/service-singleton";

type ProviderKeyValidationRouteContext = {
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

export async function POST(
  _request: Request,
  context: ProviderKeyValidationRouteContext,
): Promise<Response> {
  const { providerId: rawProviderId } = await context.params;
  const maybePathProviderId = maybeProviderId(rawProviderId);

  if (!maybePathProviderId) {
    return NextResponse.json(
      {
        code: "unsupported_provider",
        message: "Provider was not found.",
      },
      { status: 404 },
    );
  }

  const result =
    await getProviderKeyValidationService().validateProviderKey(
      maybePathProviderId,
    );

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ providerKey: result.value });
}
