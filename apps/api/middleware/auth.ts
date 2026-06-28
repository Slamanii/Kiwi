import { config } from '../config.js'
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { UserRole } from '@kiwi/types'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decode = verifyAccessToken(token, config.JWT_SECRET)
    req.user = decode as any
    next()

    } catch { 
        return res.status(401).json({ error: 'Invalid or expired token' })
    }
}

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles as UserRole[]
    const hasRole = roles.some(role => userRoles?.includes(role))
    if (!hasRole) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}