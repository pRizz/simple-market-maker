import { NextResponse } from "next/server";

import { getProviderApiKeyService } from "@/modules/settings/server/service-singleton";

function providerKeyCreateInput(rawInput: unknown): unknown {
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    return rawInput;
  }

  const input = rawInput as Record<string, unknown>;

  return {
    providerId: input.providerId,
    apiKey: input.apiKey,
    enabled: typeof input.enabled === "boolean" ? input.enabled : true,
  };
}

export async function GET(): Promise<Response> {
  const providerKeys = await getProviderApiKeyService().listProviderKeys();

  return NextResponse.json({ providerKeys });
}

export async function POST(request: Request): Promise<Response> {
  const rawInput = await request.json();
  const result = await getProviderApiKeyService().saveProviderKey(
    providerKeyCreateInput(rawInput),
  );

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ providerKey: result.value }, { status: 201 });
}
