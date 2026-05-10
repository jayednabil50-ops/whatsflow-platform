import { NextRequest, NextResponse } from "next/server";
import { authenticateSessionApiKey } from "@/lib/whatsapp/api-keys";

export const runtime = "nodejs";

function getBearerToken(request: Request): string {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice("Bearer ".length).trim() : "";
}

export async function GET(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
  }

  const session = await authenticateSessionApiKey(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  return NextResponse.json({
    sessionId: session.id,
    sessionName: session.name,
    status: session.status,
    connectedName: session.connectedName || session.name,
    connectedPhone: session.connectedPhone || session.phone,
    countryCode: session.countryCode
  });
}
