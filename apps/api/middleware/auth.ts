import { config } from '../config.js'
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { UserRole } from '@kiwi/types'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[requireAuth]', req.method, req.originalUrl, 'no Authorization header')
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decode = verifyAccessToken(token, config.JWT_SECRET)
    req.user = decode as any
    next()

    } catch (err: any) {
        console.error('[requireAuth]', req.method, req.originalUrl, 'token verify failed:', err.message)
        return res.status(401).json({ error: 'Invalid or expired token' })
    }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
        try {
            req.user = verifyAccessToken(authHeader.split(' ')[1], config.JWT_SECRET) as any
        } catch {
            // invalid/expired token on an endpoint that doesn't require auth — treat as anonymous
        }
    }
    next()
}

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles as UserRole[]
    const hasRole = roles.some(role => userRoles?.includes(role))
    if (!hasRole) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}