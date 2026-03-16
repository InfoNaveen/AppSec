import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // SECURITY FIX: Middleware Auth Fix - checks for /api directly in middleware
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  if (!user && isApiRoute) {
    return NextResponse.json({ success: false, error: 'Unauthorized via Middleware' }, { status: 401 });
  }

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/upload', '/scan-results', '/patches', '/timeline', '/settings'];
  const isProtectedRoute = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // If the user is not logged in and trying to access a protected route, redirect to login
  if (!user && isProtectedRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is logged in and trying to access login/signup, redirect to dashboard
  const authPaths = ['/login', '/signup'];
  const isAuthRoute = authPaths.some(path => req.nextUrl.pathname.startsWith(path));

  if (user && isAuthRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};