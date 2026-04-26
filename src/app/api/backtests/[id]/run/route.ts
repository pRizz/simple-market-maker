import { NextResponse } from "next/server";

import { getBacktestService } from "@/modules/backtests/server/service-singleton";

type RunBacktestRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RunBacktestRouteContext,
) {
  const { id } = await context.params;
  const runResult = await getBacktestService().runBacktest(id);

  if (!runResult.ok) {
    const status = runResult.run ? 500 : 404;

    return NextResponse.json(
      {
        message: runResult.message,
        run: runResult.run,
      },
      { status },
    );
  }

  return NextResponse.json(runResult.run, { status: 201 });
}
