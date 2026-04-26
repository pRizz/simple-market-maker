import { NextResponse } from "next/server";

import { getMarketDataService } from "@/modules/market-data/server/service-singleton";

export async function GET(): Promise<Response> {
  const chunks = await getMarketDataService().listChunks();

  return NextResponse.json({ chunks });
}

export async function POST(request: Request): Promise<Response> {
  const rawInput = await request.json();
  const result = await getMarketDataService().createChunk(rawInput);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
