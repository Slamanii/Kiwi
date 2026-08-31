import { NextRequest, NextResponse } from 'next/server'

const GATED_PREFIXES = ['/explore', '/profile', '/chat', '/admin']

export function middleware(req: NextRequest) {
    const token = req.cookies.get('accessToken')?.value
    const { pathname } = req.nextUrl

    const isGated = GATED_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))

    if (isGated && !token) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)']
}