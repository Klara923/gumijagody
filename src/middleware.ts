import { NextResponse, type NextRequest } from 'next/server'

import { SESSION_COOKIE, sessionSecretFrom, verifySessionToken } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/api/health', '/api/cron/ksef']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD
  if (!password) return NextResponse.next()

  const secret = sessionSecretFrom({
    APP_PASSWORD: password,
    APP_SESSION_SECRET: process.env.APP_SESSION_SECRET,
  })
  if (!secret) return NextResponse.next()

  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const signedIn = Boolean(token && (await verifySessionToken(token, secret)))

  if (pathname === '/login') {
    if (signedIn) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  if (isPublic(pathname) || signedIn) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Wymagane logowanie' }, { status: 401 })
  }

  const login = new URL('/login', request.url)
  login.searchParams.set('from', pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
