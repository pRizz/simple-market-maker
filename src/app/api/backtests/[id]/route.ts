import { NextResponse } from "next/server";

import { getBacktestService } from "@/modules/backtests/server/service-singleton";
import type { RawBacktestDefinitionInput } from "@/modules/backtests/ui/backtest-form-schema";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const backtestService = getBacktestService();
  const maybeBacktest = await backtestService.getBacktest(id);

  if (!maybeBacktest) {
    return NextResponse.json(
      {
        message: "Backtest not found.",
      },
      { status: 404 },
    );
  }

  const runs = await backtestService.listRuns(id);

  return NextResponse.json({
    backtest: maybeBacktest,
    runs,
  });
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const rawBody = (await request.json()) as RawBacktestDefinitionInput;
  const backtestService = getBacktestService();
  const result = await backtestService.updateBacktest(id, rawBody);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const backtestService = getBacktestService();
  const deleted = await backtestService.deleteBacktest(id);

  if (!deleted) {
    return NextResponse.json(
      {
        message: "Backtest not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    deleted: true,
  });
}
