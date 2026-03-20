// @ts-expect-error NextAuth v4 compatibility
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export default async function proxy(req: NextRequest) {
  const session = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
  });

  if (req.nextUrl.pathname.includes('/admin')) {
    console.log('Admin route access attempt:', {
      path: req.nextUrl.pathname,
      hasSession: !!session,
      userRole: session?.role,
      userEmail: session?.email,
      fullSession: session, // Debug: log full session object
    });

    if (!session || session.role !== 'Admin') {
      console.log('Access denied - redirecting to home', {
        sessionExists: !!session,
        currentRole: session?.role,
        requiredRole: 'Admin',
      });
      return NextResponse.redirect(new URL('/', req.url));
    }

    console.log('Access granted to admin route');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
