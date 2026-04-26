import { NextResponse } from "next/server";

import { getBacktestService } from "@/modules/backtests/server/service-singleton";

export async function GET(): Promise<Response> {
  const backtestService = getBacktestService();
  const backtests = await backtestService.listBacktests();

  return NextResponse.json({ backtests });
}

export async function POST(request: Request): Promise<Response> {
  const backtestService = getBacktestService();
  const rawInput = await request.json();
  const result = await backtestService.createBacktest(rawInput);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
