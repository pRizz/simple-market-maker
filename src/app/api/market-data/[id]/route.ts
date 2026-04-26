import { NextResponse } from "next/server";

import { getMarketDataService } from "@/modules/market-data/server/service-singleton";

type MarketDataChunkRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: MarketDataChunkRouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const maybeChunk = await getMarketDataService().getChunk(id);

  if (!maybeChunk) {
    return NextResponse.json(
      {
        message: "Market data chunk not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    chunk: maybeChunk,
  });
}

export async function DELETE(
  _request: Request,
  context: MarketDataChunkRouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const deleted = await getMarketDataService().deleteChunk(id);

  if (!deleted) {
    return NextResponse.json(
      {
        message: "Market data chunk not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    deleted: true,
  });
}
