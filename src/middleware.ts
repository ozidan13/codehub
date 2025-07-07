import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/platforms',
  '/tasks',
  '/submissions',
  '/admin',
  '/profile'
]

// Define admin-only routes
const adminRoutes = [
  '/admin'
]

// Define public routes that should redirect to dashboard if already authenticated
const publicAuthRoutes = [
  '/login',
  '/signup'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the token and check if the user is authenticated (NextAuth)
  const token = await getToken({ 
    req: request,
    secret: process.env.SUPABASE_JWT_SECRET
  })
  const isAuthenticated = !!token
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Check if the current route is admin-only
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  
  // Check if the current route is a public auth route (login/signup)
  const isPublicAuthRoute = publicAuthRoutes.some(route => pathname.startsWith(route))
  
  // If the route is protected (including admin routes) and the user is not authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', encodeURI(request.url))
    return NextResponse.redirect(url)
  }
  
  // If the route is admin-only and the user is authenticated but not an admin, redirect to dashboard
  if (isAdminRoute && isAuthenticated && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // If the user is authenticated and trying to access login/signup, redirect to dashboard
  if (isPublicAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // If the user is accessing the root path and is authenticated, redirect to dashboard
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.svg).*)',
  ],
}