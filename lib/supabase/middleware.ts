import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/auth/callback', '/auth/error']
  const isPublicRoute = publicRoutes.some(route => pathname === route)

  // Protected candidate routes
  const candidateRoutes = ['/dashboard', '/jobs', '/apply']
  const isCandidateRoute = candidateRoutes.some(route => pathname.startsWith(route))

  // Protected recruiter routes
  const recruiterRoutes = ['/recruiter']
  const isRecruiterRoute = recruiterRoutes.some(route => pathname.startsWith(route))

  // If not logged in and accessing protected route
  if (!user && (isCandidateRoute || isRecruiterRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in, check role-based access
  if (user && (isCandidateRoute || isRecruiterRoute)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const userRole = profile?.role

    // Candidate trying to access recruiter routes
    if (isRecruiterRoute && userRole !== 'recruiter') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Recruiter trying to access candidate routes
    if (isCandidateRoute && userRole !== 'candidate') {
      const url = request.nextUrl.clone()
      url.pathname = '/recruiter/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
