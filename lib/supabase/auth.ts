import { createServerClient as createSsrClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";
import { createClient as createServerClient } from "./server";

export class AuthenticationError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export async function requireAuthenticatedUser(request?: Request): Promise<User> {
  const authHeader = request?.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (bearerToken) {
    const { data, error } = await getSupabaseAdminClient().auth.getUser(bearerToken);

    if (error || !data.user) {
      throw new AuthenticationError();
    }

    return data.user;
  }

  if (request) {
    const supabase = createSsrClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get("cookie") || "";
          return cookieHeader
            .split(/;\s*/)
            .filter(Boolean)
            .map((entry) => {
              const separatorIndex = entry.indexOf("=");
              if (separatorIndex === -1) {
                return { name: entry, value: "" };
              }

              return {
                name: entry.slice(0, separatorIndex),
                value: entry.slice(separatorIndex + 1)
              };
            });
        },
        setAll() {
          // API routes only need to read the current auth session. Avoid mutating
          // cookies here so route handlers stay compatible with serverless runtime.
        }
      }
    });

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new AuthenticationError();
    }

    return user;
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError();
  }

  return user;
}
