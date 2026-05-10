import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticationError,
  requireAuthenticatedUser
} from "@/lib/supabase/auth";
import { listSessionApiKeys } from "@/lib/whatsapp/api-keys";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    const keys = await listSessionApiKeys(user.id);
    return NextResponse.json({ keys });
  } catch (error) {
    if (isAuthenticationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Failed to load API keys";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
