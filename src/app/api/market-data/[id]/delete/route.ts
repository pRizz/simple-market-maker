import { redirect } from "next/navigation";

import { getMarketDataService } from "@/modules/market-data/server/service-singleton";

type DeleteChunkRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: DeleteChunkRouteContext,
): Promise<never> {
  const { id } = await context.params;
  await getMarketDataService().deleteChunk(id);

  redirect("/market-data");
}
