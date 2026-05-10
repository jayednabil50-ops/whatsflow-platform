import { NextRequest, NextResponse } from "next/server";
import {
  AdminAccessAction,
  applyAdminAccessAction
} from "@/lib/platform/admin";
import { requireOwnerWorkspace, WorkspaceAccessError } from "@/lib/platform/workspace";
import {
  isAuthenticationError,
  requireAuthenticatedUser
} from "@/lib/supabase/auth";

export const runtime = "nodejs";

const validActions = new Set<AdminAccessAction>([
  "extendTrial",
  "grantSubscription",
  "expireAccess",
  "deleteUser"
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(req);
    await requireOwnerWorkspace(user.id);
    const { id } = await params;
    const body = await req.json();
    const action = body?.action as AdminAccessAction;

    if (!validActions.has(action)) {
      return NextResponse.json({ error: "Unsupported admin action." }, { status: 400 });
    }

    await applyAdminAccessAction(id, action);

    return NextResponse.json({
      success: true,
      action
    });
  } catch (error) {
    if (isAuthenticationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to update workspace access.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
