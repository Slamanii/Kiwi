import { Response, Request, NextFunction } from 'express'
import { prisma } from '@kiwi/db'
import { hashPassword, comparePassword } from '../utils/hash.js'
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../utils/jwt.js'
import { UserRole } from '@kiwi/types'
import { config } from '../config.js'
import type { SignupInput, LoginInput } from '@kiwi/types'


export async function loginOrSignup(email: string, password: string) {

}

export async function resetPassword(email: string, newPassword:string, resetToken: string) {

    const { data: record } = await prisma.user.findUnique({
        where: { email, equals: email } && { resetToken, equals: resetToken }

        if (!record) {
            throw new Error("Invalid email or reset token");    
        }
        const passwordHash = await hashPassword(newPassword)
    })
}