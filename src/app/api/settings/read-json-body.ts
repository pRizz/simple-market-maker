import { NextResponse } from "next/server";

type ReadJsonBodyResult =
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      response: Response;
    };

export async function readJsonBody(
  request: Request,
): Promise<ReadJsonBodyResult> {
  try {
    return {
      ok: true,
      value: await request.json(),
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: "Request body must be valid JSON.",
        },
        { status: 400 },
      ),
    };
  }
}
