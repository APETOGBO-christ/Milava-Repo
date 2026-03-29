const missingMessage = (keys: string[]) =>
  `Missing required Supabase environment variables: ${keys.join(', ')}`;

function requireValue(
  value: string | undefined,
  variableName: string
): string {
  if (!value) {
    throw new Error(missingMessage([variableName]));
  }

  return value;
}

export function getSupabaseBrowserEnv() {
  // NOTE: keep explicit env access for Next.js client-side replacement.
  const url = requireValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_URL'
  );
  const anonKey = requireValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );

  return {
    url,
    anonKey,
  };
}

export function getSupabaseServiceEnv() {
  const url = requireValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_URL'
  );
  const serviceRoleKey = requireValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    'SUPABASE_SERVICE_ROLE_KEY'
  );

  return {
    url,
    serviceRoleKey,
  };
}
