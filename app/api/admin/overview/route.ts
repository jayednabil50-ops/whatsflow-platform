import { NextRequest, NextResponse } from "next/server";
import { getAdminOverview } from "@/lib/platform/admin";
import { requireOwnerWorkspace, WorkspaceAccessError } from "@/lib/platform/workspace";
import {
  isAuthenticationError,
  requireAuthenticatedUser
} from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    await requireOwnerWorkspace(user.id);

    const overview = await getAdminOverview();
    return NextResponse.json(overview);
  } catch (error) {
    if (isAuthenticationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to load admin overview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
