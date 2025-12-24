
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Fallback for build time / edge if env vars are missing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "example-key";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Bypass auth in development if special cookie is set
  if (process.env.NODE_ENV === 'development' && request.cookies.get('local-auth-bypass')) {
    return NextResponse.next()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
     // Redirect to login if not authenticated
     const loginUrl = request.nextUrl.clone()
     loginUrl.pathname = '/login'
     return NextResponse.redirect(loginUrl)
  }

  // Allow-list Check (Only for authenticated users)
  if (user) {
    // Import check function dynamically or inline logic to avoid dependency issues in Edge if complex
    // Simple direct query here to keep middleware self-contained often better, 
    // but we can try importing the helper.
    // Note: We reuse the supabase client created above.

    // 1. Check if user is allowed (query AllowedUser table)
    const { data: allowedUser, error } = await supabase
        .from('AllowedUser')
        .select('role, isActive')
        .eq('email', user.email)
        .single();
    
    const isAllowed = allowedUser && allowedUser.isActive;
    const isUnauthorizedPage = request.nextUrl.pathname === '/unauthorized';

    if (!isAllowed) {
        if (!isUnauthorizedPage) {
            // Redirect unallowed users to unauthorized page
            const url = request.nextUrl.clone()
            url.pathname = '/unauthorized'
            return NextResponse.redirect(url)
        }
    } else {
        // User IS allowed
        if (isUnauthorizedPage) {
            // Redirect allowed users away from unauthorized page
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
        
        // Admin Route Check
        if (request.nextUrl.pathname.startsWith('/admin')) {
             if (allowedUser.role !== 'ADMIN') {
                 // Non-admin trying to access admin
                 const url = request.nextUrl.clone()
                 url.pathname = '/' // or unauthorized
                 return NextResponse.redirect(url)
             }
        }
    }
  }

  // Redirect to home if logged in and trying to access login
  if (user && request.nextUrl.pathname.startsWith('/login')) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/'
      return NextResponse.redirect(homeUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ingest (allow ingestion without auth? maybe separate key? for now protect everything except public assets)
     * - Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
