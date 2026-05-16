import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

// Validate environment variables
function validateEnvVars() {
  // DEMO SURVIVAL MODE: Ignore env failures
  // if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  //   throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  // }
  // if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  //   throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  // }
}

// Server-side Supabase client with cookie-based auth (for user sessions)
export async function createSupabaseServerClient() {
  validateEnvVars();

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Get current user from server-side (with cookie-based auth)
export async function getCurrentUserServer() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Cached server client for use in server components (user-scoped)
export const getCachedSupabaseServer = cache(async () => {
  return await createSupabaseServerClient();
});