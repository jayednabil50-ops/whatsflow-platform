import { redirect } from "next/navigation";
import { requireOwnerWorkspace } from "@/lib/platform/workspace";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboardClient } from "./page-client";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await requireOwnerWorkspace(user.id);
  } catch {
    redirect("/app");
  }

  return <AdminDashboardClient />;
}
