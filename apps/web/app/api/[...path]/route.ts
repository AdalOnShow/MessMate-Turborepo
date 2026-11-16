import { type NextRequest, NextResponse } from "next/server";
import { ErrorCode } from "@repo/shared";
import { api } from "../../lib/api-client";

/**
 * Read-only bridge from the browser to the Nest API.
 *
 * Page data used to load through server actions, and Next.js runs server
 * actions one at a time, so a dashboard's 6-8 reads waited in a queue. Plain
 * GET requests to this route run in parallel. The access token stays in its
 * httpOnly cookie; `api.get` attaches it and refreshes it on a 401 exactly
 * as server actions do. Writes still go through server actions.
 */

// Only these API areas may be read through the bridge.
const ALLOWED_ROOTS = new Set([
  "bazaar",
  "deposits",
  "expenses",
  "invites",
  "meals",
  "messes",
  "months",
  "users",
]);

const SAFE_SEGMENT = /^[A-Za-z0-9._~-]+$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  const valid =
    path.length > 0 &&
    ALLOWED_ROOTS.has(path[0]!) &&
    path.every((s) => SAFE_SEGMENT.test(s) && s !== "." && s !== "..");

  if (!valid) {
    return NextResponse.json(
      {
        ok: false,
        status: 404,
        code: ErrorCode.NOT_FOUND,
        message: "Not found",
      },
      { status: 404 },
    );
  }

  const search = request.nextUrl.search;
  const result = await api.get<unknown>(`/${path.join("/")}${search}`);

  return NextResponse.json(result, {
    status: result.ok ? 200 : result.status || 502,
    headers: { "Cache-Control": "private, no-store" },
  });
}
