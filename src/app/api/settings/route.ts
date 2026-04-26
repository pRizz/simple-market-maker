import { NextResponse } from "next/server";

import { selectableDefaultProviderIds } from "@/modules/settings/domain/app-settings";
import { providerDescriptors } from "@/modules/settings/domain/provider-registry";
import {
  getProviderApiKeyService,
  getSettingsService,
} from "@/modules/settings/server/service-singleton";

function environmentFallbacks() {
  return Object.values(providerDescriptors).flatMap((provider) => {
    const maybeEnvironmentName = provider.maybeEnvironmentFallbackName;

    if (!maybeEnvironmentName) {
      return [];
    }

    return [
      {
        providerId: provider.id,
        name: maybeEnvironmentName,
        configured: Boolean(process.env[maybeEnvironmentName]?.trim()),
      },
    ];
  });
}

export async function GET(): Promise<Response> {
  const settingsResult = await getSettingsService().getSettings();

  if (!settingsResult.ok) {
    return NextResponse.json(settingsResult, { status: 500 });
  }

  const providerKeys = await getProviderApiKeyService().listProviderKeys();

  return NextResponse.json({
    settings: settingsResult.value,
    providers: Object.values(providerDescriptors),
    selectableDefaultProviderIds,
    providerKeys,
    environmentFallbacks: environmentFallbacks(),
  });
}

export async function PUT(request: Request): Promise<Response> {
  const rawInput = await request.json();
  const result = await getSettingsService().updateSettings(rawInput);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    settings: result.value,
  });
}
