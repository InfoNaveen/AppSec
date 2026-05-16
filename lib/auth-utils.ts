import { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for API routes with cookie-based auth
 */
export async function createSupabaseApiClient(request: NextRequest) {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value || cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // In API routes, we can't set cookies directly
          // This is handled by the response
        },
        remove(name: string, options: CookieOptions) {
          // In API routes, we can't remove cookies directly
          // This is handled by the response
        },
      },
    }
  );
}

/**
 * Get the current authenticated user from an API request
 */
export async function getAuthenticatedUser(request: NextRequest) {
  // Hackathon override: Return a mock user so all API routes bypass auth checks
  return { id: null, email: 'hackathon@devsentinel.ai' } as any;
}

