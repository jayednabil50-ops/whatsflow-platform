import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleConfig } from "@/lib/supabase/config";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      acceptedTerms?: boolean;
    };

    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";
    const acceptedTerms = body.acceptedTerms === true;

    if (!acceptedTerms) {
      return NextResponse.json(
        { error: "Please accept the responsible messaging policy to continue." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (!hasSupabaseServiceRoleConfig()) {
      return NextResponse.json(
        { error: "Server auth is not configured yet. Add the Supabase service role key." },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user?.id) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email,
          full_name: name,
          plan: "trial"
        },
        {
          onConflict: "id"
        }
      );

      if (profileError) {
        console.error("[AUTH] Failed to upsert profile during registration:", profileError);
      }
    }

    return NextResponse.json({
      success: true,
      userId: data.user?.id || null
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Account creation failed."
      },
      { status: 500 }
    );
  }
}
