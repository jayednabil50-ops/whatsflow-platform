import { NextResponse } from "next/server";
import { resolveServerPublicBaseUrl } from "@/lib/platform/public-base-url.server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const baseUrl = resolveServerPublicBaseUrl(new Headers(req.headers));
  return NextResponse.json({ baseUrl });
}
