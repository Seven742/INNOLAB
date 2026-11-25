import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(req) {
  const secret = process.env.NEXTAUTH_SECRET || 'innolab-secret-key-change-in-production';
  const token = await getToken({ req, secret });
  const { pathname, search } = req.nextUrl;

  // 1. If user is already authenticated and visits /login, redirect to /dashboard
  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 2. Protect /dashboard and all subroutes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Root URL redirect: if logged in -> /dashboard, else -> /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', req.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
