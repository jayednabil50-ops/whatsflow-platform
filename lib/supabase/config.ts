const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publicSupabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export function getSupabaseUrl(): string {
  if (!publicSupabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  return publicSupabaseUrl;
}

export function getSupabasePublishableKey(): string {
  const value = publicSupabasePublishableKey || publicSupabaseAnonKey;

  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }

  return value;
}

export function getSupabaseServiceRoleKey(): string {
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return serviceRoleKey;
}

export function hasSupabaseServiceRoleConfig(): boolean {
  return Boolean(publicSupabaseUrl && serviceRoleKey);
}

export function hasSupabaseBrowserConfig(): boolean {
  return Boolean(publicSupabaseUrl && (publicSupabasePublishableKey || publicSupabaseAnonKey));
}
