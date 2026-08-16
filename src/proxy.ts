import { NextResponse, type NextRequest } from 'next/server'

import { FLASH_COOKIE, FLASH_HEADER, flashCookieOptions } from '@/lib/flash'
import { SESSION_COOKIE, sessionSecretFrom, verifySessionToken } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/api/health', '/api/cron/ksef']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function continueRequest(request: NextRequest) {
  const raw = request.cookies.get(FLASH_COOKIE)?.value
  const requestHeaders = new Headers(request.headers)
  if (raw) requestHeaders.set(FLASH_HEADER, raw)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  if (raw) {
    response.cookies.set(FLASH_COOKIE, '', flashCookieOptions(0))
  }

  return response
}

export async function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD
  if (!password) return continueRequest(request)

  const secret = sessionSecretFrom({
    APP_PASSWORD: password,
    APP_SESSION_SECRET: process.env.APP_SESSION_SECRET,
  })
  if (!secret) return continueRequest(request)

  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const signedIn = Boolean(token && (await verifySessionToken(token, secret)))

  if (pathname === '/login') {
    if (signedIn) return NextResponse.redirect(new URL('/', request.url))
    return continueRequest(request)
  }

  if (isPublic(pathname) || signedIn) {
    if (pathname.startsWith('/api/')) return NextResponse.next()
    return continueRequest(request)
  }

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
