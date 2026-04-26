import { NextResponse } from "next/server";

import { readJsonBody } from "@/app/api/settings/read-json-body";
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
  const jsonBody = await readJsonBody(request);

  if (!jsonBody.ok) {
    return jsonBody.response;
  }

  const result = await getProviderApiKeyService().saveProviderKey(
    providerKeyCreateInput(jsonBody.value),
  );

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ providerKey: result.value }, { status: 201 });
}
