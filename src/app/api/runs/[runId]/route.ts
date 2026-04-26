import { NextResponse } from "next/server";

import { getBacktestService } from "@/modules/backtests/server/service-singleton";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { runId } = await context.params;
  const backtestService = getBacktestService();
  const maybeRun = await backtestService.getRun(runId);

  if (!maybeRun) {
    return NextResponse.json(
      {
        message: "Run not found.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    run: maybeRun,
  });
}
