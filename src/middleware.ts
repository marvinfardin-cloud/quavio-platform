import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /rosa/* paths (but not /rosa/login itself)
  if (pathname.startsWith('/rosa/') && !pathname.startsWith('/rosa/login')) {
    const auth = request.cookies.get('rosa_auth')
    if (!auth || auth.value !== 'true') {
      return NextResponse.redirect(new URL('/rosa/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
